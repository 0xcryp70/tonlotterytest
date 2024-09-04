document.addEventListener("DOMContentLoaded", function () {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log("Telegram WebApp is initialized");

        const userIdElement = document.getElementById("user-id");
        const authButton = document.getElementById("auth-button");
        const stepsMessage = document.getElementById("steps-message");

        const userId = tg.initDataUnsafe.user?.id || "Unknown User";
        userIdElement.innerText = userId;

        authButton.addEventListener("click", () => {
            window.location.href = `/auth/google?userId=${userId}`;
        });

        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        if (success) {
            fetchSteps(userId);
        }

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
    } else {
        console.log("Telegram WebApp API not available. Running outside Telegram?");
        document.getElementById("user-id").innerText = "Running outside Telegram. No user ID available.";
    }
});

