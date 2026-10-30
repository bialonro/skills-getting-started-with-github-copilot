document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderParticipants(section, activityName, participants, onRemove) {
    section.replaceChildren();

    const heading = document.createElement("h5");
    heading.textContent = `Participants (${participants.length})`;
    section.appendChild(heading);

    if (participants.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "participants-empty";
      emptyMessage.textContent = "No participants yet";
      section.appendChild(emptyMessage);
      return;
    }

    const participantsList = document.createElement("ul");
    participantsList.className = "participants-list";

    participants.forEach((participant) => {
      const participantItem = document.createElement("li");
      participantItem.className = "participant-item";

      const participantName = document.createElement("span");
      participantName.textContent = participant;
      participantItem.appendChild(participantName);

      const removeButton = document.createElement("button");
      removeButton.className = "participant-remove";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `Unregister ${participant}`);
      removeButton.title = `Unregister ${participant}`;
      removeButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
        </svg>
      `;
      removeButton.addEventListener("click", async () => {
        removeButton.disabled = true;
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participant)}`,
            { method: "DELETE" }
          );
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Failed to unregister participant");
          }

          const participantIndex = participants.indexOf(participant);
          if (participantIndex !== -1) {
            participants.splice(participantIndex, 1);
          }
          renderParticipants(section, activityName, participants, onRemove);
          onRemove();
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
        } catch (error) {
          messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
          messageDiv.className = "error";
          console.error("Error unregistering participant:", error);
        }

        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      });
      participantItem.appendChild(removeButton);
      participantsList.appendChild(participantItem);
    });

    section.appendChild(participantsList);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
        `;

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, `${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        renderParticipants(participantsSection, name, details.participants, () => {
          availability.lastChild.textContent =
            `${details.max_participants - details.participants.length} spots left`;
        });
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      return true;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
      return false;
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        const activitiesRefreshed = await fetchActivities();
        messageDiv.textContent = activitiesRefreshed
          ? result.message
          : `${result.message}, but the activity list could not be refreshed. Please reload the page.`;
        messageDiv.className = activitiesRefreshed ? "success" : "info";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
