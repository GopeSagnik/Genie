// genie-info.js

document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('genie-info-button');
    const popupOverlay = document.getElementById('genie-info-popup-overlay');
    const closeButton = popupOverlay.querySelector('.genie-info-popup-close-button');
    const popupContent = popupOverlay.querySelector('.genie-info-popup-content'); // Reference to the content box

    // Function to show the popup
    function showPopup() {
        popupOverlay.classList.add('is-visible');
    }

    // Function to hide the popup
    function hidePopup() {
        popupOverlay.classList.remove('is-visible');
    }

    // Event listener for the info button click
    infoButton.addEventListener('click', showPopup);

    // Event listener for the close button inside the popup
    closeButton.addEventListener('click', hidePopup);

    // Event listener for clicking outside the content box to close the popup
    popupOverlay.addEventListener('click', (event) => {
        // If the click target is the overlay itself (not the content)
        if (event.target === popupOverlay) {
            hidePopup();
        }
    });

    // Optional: Close with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && popupOverlay.classList.contains('is-visible')) {
            hidePopup();
        }
    });
});