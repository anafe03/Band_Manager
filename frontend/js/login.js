document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    const status = document.getElementById('login-status');
  
    if (error) {
      status.textContent = '❌ ' + error.message;
    } else {
      status.textContent = '✅ Login successful!';
      window.location.href = '/index.html'; // or wherever you want to send them
    }
  });
  
  document.getElementById('google-signin').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  
    if (error) {
      alert('Google login error: ' + error.message);
    }
  });