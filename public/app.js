document.querySelector('.send').addEventListener('click', async () => {
    const messageInput = document.querySelector('.enter-message');
    const messageContent = messageInput.value.trim();
    const recipient = document.querySelector('.messages h2').textContent.split(' ')[2]; 

    if (!messageContent || !recipient) {
        return; 
    }

    try {
        const response = await fetch('http://127.0.0.1:3002/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: localStorage.getItem("username"), recipient, content: messageContent })
        });

        if (response.ok) {
            messageInput.value = ''; 
            loadMessages(recipient); 
        } else {
            console.error('Ошибка отправки сообщения:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});


function updateCurrentUsername() {
    const currentUsernameElement = document.getElementById('current-username');
    if (!currentUsernameElement) {
        console.error("Элемент с id 'current-username' не найден");
        return;
    }

    const username = localStorage.getItem("username");
    if (username) {
        currentUsernameElement.textContent = `${username}`;
    } else {
        currentUsernameElement.textContent = "Гость";
    }
}

async function loadMessages(username) {
    try {
        const response = await fetch(`http://127.0.0.1:3002/messages?with=${username}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();
        const messagesDiv = document.querySelector('.messages');

        messagesDiv.innerHTML += messages.map(msg => `
            <div class="message">
                <strong>${msg.sender}</strong>: ${msg.content}
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}


async function loadUserList() {
    try {
        const response = await fetch('http://127.0.0.1:3002/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        const userList = document.getElementById('user-list');
        userList.innerHTML = users
            .map(user => `
                <li class="user-item" data-username="${user}">
                    ${user} 
                    ${user === localStorage.getItem('username') ? '(Вы)' : ''}
                </li>
            `)
            .join('');

        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const selectedUser = item.getAttribute('data-username');
                openChatWithUser(selectedUser);
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

function openChatWithUser(username) {
    const messagesDiv = document.querySelector('.messages');
    messagesDiv.innerHTML = `<h2 class="title">Чат с ${username}</h2>`; 

    loadMessages(username);
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => item.classList.remove('active'));

    // Add 'active' class to the selected user item
    const selectedUserItem = document.querySelector(`.user-item[data-username="${username}"]`);
    if (selectedUserItem) {
        selectedUserItem.classList.add('active');
    }
}



document.addEventListener('DOMContentLoaded', () => {
    updateCurrentUsername();
    loadUserList();

    const createBtn = document.getElementById('create');
    const errorMessage = document.getElementById('error-message');

    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                errorMessage.textContent = 'Заполните все поля!';
                errorMessage.style.color = "red";
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:3002/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const text = await response.text();
                const responseData = text ? JSON.parse(text) : {};

                if (response.ok) {
                    localStorage.setItem("username", username); 
                    alert('Пользователь зарегистрирован!');
                    window.location.href = "chat.html";
                } else if (response.status === 409) {
                    errorMessage.textContent = 'Пользователь уже существует!';
                    errorMessage.style.color = "red";
                } else {
                    errorMessage.textContent = responseData.error || 'Ошибка сервера';
                    errorMessage.style.color = "red";
                }
            } catch (error) {
                console.error('Ошибка:', error);
                errorMessage.textContent = 'Нет соединения с сервером';
                errorMessage.style.color = "red";
            }
        });
    }

    const loginButton = document.getElementById("login-button");

    if (loginButton) {
        loginButton.addEventListener("click", async () => {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if (!username || !password) {
                errorMessage.textContent = 'Заполните все поля!';
                errorMessage.style.color = "red";
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:3002/login', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem("username", username); 
                    alert('Вход успешен!');
                    window.location.href = "chat.html";
                } else {
                    errorMessage.textContent = data.error || 'Ошибка при входе';
                    errorMessage.style.color = "red";
                }
            } catch (error) {
                console.error('Ошибка:', error);
                errorMessage.textContent = 'Нет соединения с сервером';
                errorMessage.style.color = "red";
            }
        });
    } else {
        console.error("Кнопка входа не найдена");
    }

    const exitButton = document.querySelector(".exit-button");
    if (exitButton) {
        exitButton.addEventListener("click", async () => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");

            try {
                const response = await fetch('http://127.0.0.1:3002/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    console.log("Пользователь вышел");
                }
            } catch (error) {
                console.error("Ошибка при выходе:", error);
            }

            window.location.href = "index.html";
        });
    }
});


 