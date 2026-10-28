async function login(nutzer, versuch) {
    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: nutzer,
                password: versuch,
            }),
        });
        if (response.status === 429) {
            let errorMessage = "Rate limit exceeded. Please try again later.";
            try {
                const data = await response.json();
                if (data?.error) errorMessage = data?.error;
            } catch (error) {
                console.error("Error parsing JSON response: " + error.message);
            }
            console.warn(errorMessage);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
            throw new Error("Rate limit exceeded. Please try again later.");
        }
        return response.status === 200;
    } catch (error) {
        if (error.message.includes("Rate limit exceeded")) {
            console.error("Rate limit exceeded. Please try again later.");
            process.exit(1);
        }
        throw error;
    }
}

module.exports = { login };