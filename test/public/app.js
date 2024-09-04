document.addEventListener("DOMContentLoaded", function () {
    const tg = window.Telegram.WebApp;
    const userIdElement = document.getElementById("user-id");
    const authButton = document.getElementById("auth-button");
    const stepsMessage = document.getElementById("steps-message");

    //const userId = tg.initDataUnsafe.user.id;
    const userId = 1111; 
    userIdElement.innerText = userId;

    // Handle Google Fit authorization
    authButton.addEventListener("click", () => {
        window.location.href = `/auth/google?userId=${userId}`;
    });

    // After the user authorizes Google Fit, request steps
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    if (success) {
        fetchSteps(userId);
    }

    // Fetch the steps for the user
    async function fetchSteps(userId) {
        const response = await fetch('/steps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        const result = await response.json();
        stepsMessage.innerText = `You have walked ${result.steps} steps in the last 24 hours.`;
    }

    tg.expand();
});

