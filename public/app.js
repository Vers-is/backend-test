// function openChatWithUser(username) {
//     if (!username) return;
//     const inputContent = document.querySelector(".input-content");
//     if (inputContent) {
//         inputContent.style.display = 'flex'; 
//     }
//     loadMessages(username);
// }

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentUsername();
    loadUserList();

    const sendButton = document.querySelector('.send');
    const messageInput = document.querySelector('.enter-message');

    if (messageInput) {
        messageInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await sendMessage();
            }
        });
    } else {
        console.error("Элемент '.enter-message' не найден");
    }

    if (sendButton) {
        sendButton.addEventListener('click', async () => {
            await sendMessage();
        });
    } else {
        console.error("Элемент '.send' не найден");
    }

    async function sendMessage() {
        const messageContent = messageInput.value.trim();
        const recipientElement = document.querySelector('.chat-header h2');
        
        if (!recipientElement) {
            alert('Выберите собеседника из списка!');
            return;
        }
        
        const recipient = recipientElement.textContent.match(/Чат с (.+)/)?.[1];
        const sender = localStorage.getItem("username");
        
        if (!messageContent || !recipient) {
            alert('Введите сообщение и выберите получателя!');
            return;
        }
        
        if (!sender) {
            alert('Требуется авторизация!');
            window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:3002/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender, recipient, content: messageContent })
            });

            if (response.ok) {
                messageInput.value = '';
                loadMessages(recipient);
            } else {
                const error = await response.json();
                console.error('Ошибка сервера:', error);
                alert(`Ошибка: ${error.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Нет соединения с сервером');
        }
    }
});

async function loadMessages(username) {
    if (!username) return;
    
    try {
        const sender = localStorage.getItem("username");
        const lowerSender = sender.toLowerCase();
        const lowerUsername = username.toLowerCase();
        
        const encodedUsername = encodeURIComponent(lowerUsername);
        const encodedSender = encodeURIComponent(lowerSender);
        const response = await fetch(`http://127.0.0.1:3002/messages?currentUser=${encodedSender}&with=${encodedUsername}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }
    
        const messages = await response.json();

        const headerElement = document.querySelector('.chat-header');
        const messagesListElement = document.querySelector('.messages-list');
        
        if (headerElement) {
            headerElement.innerHTML = `<h2> ${username}</h2>`;
        } else {
            console.error("Элемент '.chat-header' не найден");
        }
        
        if (messagesListElement) {
            messagesListElement.innerHTML = '';
        } else {
            console.error("Элемент '.messages-list' не найден");
        }
        
        messages.forEach(msg => {
            const messageClass = msg.sender === lowerSender ? 'sent' : 'received';
            const messageHTML = `
                <div class="message ${messageClass}">
                    <div class="message-header">
                        <div class="message-sender">${msg.sender}</div>
                        <div class="message-content">${msg.content}</div>
                    </div>
                    <span class="time">${new Date(msg.created_at).toLocaleString()}</span>
                </div>
            `;
            if (messagesListElement) {
                messagesListElement.insertAdjacentHTML('beforeend', messageHTML);
            }
        });
        
        if (messagesListElement) {
            messagesListElement.scrollTop = messagesListElement.scrollHeight;
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert(error.message);
    }
}

function updateCurrentUsername() {
    const currentUsernameElement = document.getElementById('current-username');
    if (!currentUsernameElement) {
        console.error("Элемент '#current-username' не найден");
        return;
    }
    
    const username = localStorage.getItem("username") || "Гость";
    currentUsernameElement.textContent = username;
}

async function loadUserList() {
    try {
        const response = await fetch('http://127.0.0.1:3002/users');
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        
        const users = await response.json();
        const userList = document.getElementById('user-list');
        if (userList) {
            userList.innerHTML = users.map(user => `
                <li class="user-item" data-username="${user}">
                    ${user} ${user === localStorage.getItem('username') ? '(Вы)' : ''}
                </li>
            `).join('');
        } else {
            console.error("Элемент '#user-list' не найден");
        }

        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                openChatWithUser(item.dataset.username);
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки списка пользователей:', error);
        alert(error.message);
    }
}

function openChatWithUser(username) {
    if (!username) return;
    const inputContent = document.querySelector(".input-content");
    if (inputContent) {
        inputContent.style.display = 'flex'; 
    }
    loadMessages(username);
}

document.addEventListener('DOMContentLoaded', () => {
    const errorMessage = document.getElementById('error-message');

    const createButton = document.getElementById('create');
    createButton?.addEventListener('click', async () => {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!username || !password) {
            if (errorMessage) {
                errorMessage.textContent = 'Заполните все поля!';
                errorMessage.style.color = "red";
            } else {
                alert('Заполните все поля!');
            }
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:3002/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("username", username);
                alert('Регистрация успешна!');
                window.location.href = "chat.html";
            } else {
                if (errorMessage) {
                    errorMessage.textContent = data.error || 'Ошибка сервера';
                    errorMessage.style.color = "red";
                } else {
                    alert(data.error || 'Ошибка сервера');
                }
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            if (errorMessage) {
                errorMessage.textContent = 'Нет соединения с сервером';
                errorMessage.style.color = "red";
            } else {
                alert('Нет соединения с сервером');
            }
        }
    });

    const loginButton = document.getElementById("login-button");
    loginButton?.addEventListener("click", async () => {
        const username = document.getElementById("username")?.value.trim();
        const password = document.getElementById("password")?.value.trim();

        if (!username || !password) {
            if (errorMessage) {
                errorMessage.textContent = 'Заполните все поля!';
                errorMessage.style.color = "red";
            } else {
                alert('Заполните все поля!');
            }
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
                if (errorMessage) {
                    errorMessage.textContent = data.error || 'Ошибка входа';
                    errorMessage.style.color = "red";
                } else {
                    alert(data.error || 'Ошибка входа');
                }
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (errorMessage) {
                errorMessage.textContent = 'Нет соединения с сервером';
                errorMessage.style.color = "red";
            } else {
                alert('Нет соединения с сервером');
            }
        }
    });
    
    const exitButton = document.querySelector(".exit-button");
    exitButton?.addEventListener("click", async () => {
        localStorage.clear();
        sessionStorage.clear();

        try {
            await fetch('http://127.0.0.1:3002/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        }
        
        window.location.href = "index.html";
    });
});
