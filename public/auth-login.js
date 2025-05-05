document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    const loginAlert = document.getElementById('login-alert');
    const loginSuccess = document.getElementById('login-success');
    const registerAlert = document.getElementById('register-alert');
    const registerSuccess = document.getElementById('register-success');
  
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to todo app if already logged in
      window.location.href = 'index.html';
    }
  
    // Show register form
    showRegisterLink.addEventListener('click', function(e) {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      
      // Clear any error/success messages
      loginAlert.style.display = 'none';
      loginSuccess.style.display = 'none';
    });
  
    // Show login form
    showLoginLink.addEventListener('click', function(e) {
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
      
      // Clear any error/success messages
      registerAlert.style.display = 'none';
      registerSuccess.style.display = 'none';
    });
  
    // Login form submission
    document.getElementById('login').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Hide previous messages
      loginAlert.style.display = 'none';
      loginSuccess.style.display = 'none';
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Show error message
          loginAlert.textContent = data.error || 'Login failed. Please try again.';
          loginAlert.style.display = 'block';
          return;
        }
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        
        // Show success message
        loginSuccess.textContent = 'Login successful! Redirecting...';
        loginSuccess.style.display = 'block';
        
        // Redirect to todo app
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        loginAlert.textContent = 'An error occurred. Please try again.';
        loginAlert.style.display = 'block';
        console.error('Login error:', error);
      }
    });
  
    // Register form submission
    document.getElementById('register').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Hide previous messages
      registerAlert.style.display = 'none';
      registerSuccess.style.display = 'none';
      
      // Validate passwords match
      if (password !== confirmPassword) {
        registerAlert.textContent = 'Passwords do not match.';
        registerAlert.style.display = 'block';
        return;
      }
      
      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Show error message
          registerAlert.textContent = data.error || 'Registration failed. Please try again.';
          registerAlert.style.display = 'block';
          return;
        }
        
        // Show success message
        registerSuccess.textContent = 'Registration successful! You can now login.';
        registerSuccess.style.display = 'block';
        
        // Clear form
        document.getElementById('register').reset();
        
        // Switch to login form after 2 seconds
        setTimeout(() => {
          registerForm.style.display = 'none';
          loginForm.style.display = 'block';
        }, 2000);
        
      } catch (error) {
        registerAlert.textContent = 'An error occurred. Please try again.';
        registerAlert.style.display = 'block';
        console.error('Registration error:', error);
      }
    });
  });