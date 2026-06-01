document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on reload
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML = `
          <div class="participants">
            <button class="toggle-participants">Show participants (${details.participants.length})</button>
            <ul class="participants-list hidden">
              ${details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="remove-participant" data-email="${p}" title="Remove">✖</button></li>`).join('')}
            </ul>
            <p class="no-participants hidden">No participants</p>
          </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p class="schedule"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Add event listeners for toggle and remove buttons
        const toggleBtn = activityCard.querySelector('.toggle-participants');
        const participantsList = activityCard.querySelector('.participants-list');
        const noParticipants = activityCard.querySelector('.no-participants');

        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            if (participantsList) participantsList.classList.toggle('hidden');
            if (noParticipants) noParticipants.classList.toggle('hidden');
            const isVisible = participantsList && !participantsList.classList.contains('hidden');
            toggleBtn.textContent = isVisible ? 'Hide participants' : `Show participants (${details.participants.length})`;
          });
        }

        // Handle remove participant clicks
        const removeButtons = activityCard.querySelectorAll('.remove-participant');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const email = btn.dataset.email;
            try {
              const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const data = await res.json();
              if (res.ok) {
                // remove from DOM
                const li = btn.closest('li');
                if (li) li.remove();
                // update local details and availability text
                details.participants = details.participants.filter(p => p !== email);
                const availabilityEl = activityCard.querySelector('.availability');
                if (availabilityEl) {
                  const newSpots = details.max_participants - details.participants.length;
                  availabilityEl.textContent = `Availability: ${newSpots} spots left`;
                }
                // update toggle text
                if (toggleBtn) toggleBtn.textContent = `Show participants (${details.participants.length})`;
                if (details.participants.length === 0) {
                  if (noParticipants) noParticipants.classList.remove('hidden');
                  if (participantsList) participantsList.classList.add('hidden');
                }
              } else {
                alert(data.detail || 'Failed to remove participant');
              }
            } catch (err) {
              console.error(err);
              alert('Failed to remove participant');
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
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
