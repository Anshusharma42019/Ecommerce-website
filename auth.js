const API_BASE_URL = ENV.PRODUCTS_API;

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Utility function to show alerts
  const showAlert = (alertId, message, type = 'error') => {
    const alertEl = document.getElementById(alertId);
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `alert alert-${type}`;
    alertEl.style.display = 'block';
    // Auto hide after 5 seconds
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 5000);
  };

  // Set loading state on buttons
  const setLoading = (btn, isLoading, originalText) => {
    if (!btn) return;
    if (isLoading) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn = document.getElementById('loginBtn');
      const originalText = btn.innerHTML;

      setLoading(btn, true, originalText);

      try {
        console.log("Sending login payload for:", email);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log("Login Server response:", data);
        
        if (!response.ok) {
          const serverMsg = data.message || 'Login failed. Please try again.';
          alert('Login Error: ' + serverMsg);
          throw new Error(serverMsg);
        }

        // Save token and user info
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
        
        // Redirect to home page or target page
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'index.html';
        const openCart = urlParams.get('openCart') === 'true';

        setTimeout(() => {
          window.location.href = `${redirectUrl}${openCart ? '?openCart=true' : ''}`;
        }, 1500);

      } catch (err) {
        showAlert('loginAlert', err.message, 'error');
      } finally {
        setLoading(btn, false, originalText);
      }
    });
  }

  // Register Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value
      };

      const btn = document.getElementById('registerBtn');
      const originalText = btn.innerHTML;

      setLoading(btn, true, originalText);

      try {
        console.log("Sending payload:", payload);
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log("Server response:", data);
        
        if (!response.ok) {
          // Check for validation errors array
          if (data.errors && data.errors.length > 0) {
             const errorMsg = data.errors[0].msg || data.errors[0].message || 'Validation failed';
             alert('Validation Error: ' + errorMsg); // Fallback popup
             throw new Error(errorMsg);
          }
          const serverMsg = data.message || 'Registration failed. Please try again.';
          alert('Error: ' + serverMsg);
          throw new Error(serverMsg);
        }

        showAlert('registerAlert', 'Account created successfully! Please sign in.', 'success');
        
        // Redirect to login page preserving query params if any
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        const openCartParam = urlParams.get('openCart');
        let loginUrl = 'login.html';
        if (redirectParam) {
          loginUrl += `?redirect=${encodeURIComponent(redirectParam)}`;
          if (openCartParam) loginUrl += `&openCart=${openCartParam}`;
        }

        setTimeout(() => {
          window.location.href = loginUrl;
        }, 2000);

      } catch (err) {
        showAlert('registerAlert', err.message, 'error');
      } finally {
        setLoading(btn, false, originalText);
      }
    });
  }
  
  // Navbar Update Logic
  const updateNavbar = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('accessToken');
    
    const accountIcons = document.querySelectorAll('.nav-icon[aria-label="Account"]');
    
    if (user && token) {
      // Create Profile Modal if it doesn't exist
      if (!document.getElementById('userProfileModal')) {
        const hasAddress = user.addresses && user.addresses.length > 0;
        const address = hasAddress ? user.addresses[0] : {};
        
        const modalHtml = `
          <div class="cart-drawer-overlay" id="userProfileOverlay" style="z-index: 10000000; display: none; opacity: 0; transition: opacity 0.3s ease;"></div>
          <div id="userProfileModal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95); background: white; width: 90%; max-width: 400px; border-radius: 20px; z-index: 10000001; display: none; opacity: 0; transition: all 0.3s ease; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden; max-height: 90vh; overflow-y: auto;">
            
            <!-- VIEW MODE -->
            <div id="profileViewMode">
              <div style="background: linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%); padding: 30px 20px 20px; text-align: center; color: white; position: relative;">
                <button id="closeProfileModal" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.3s;"><i class="fas fa-times"></i></button>
                <button id="editProfileBtn" style="position: absolute; top: 15px; left: 15px; background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.3s;" title="Edit Profile"><i class="fas fa-pen"></i></button>
                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border: 2px solid white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; backdrop-filter: blur(5px);">
                  ${user.firstName.charAt(0).toUpperCase()}
                </div>
                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">${user.firstName} ${user.lastName || ''}</h2>
                <p style="margin: 5px 0 0; opacity: 0.9; font-size: 0.9rem;">${user.email}</p>
              </div>
              
              <div style="padding: 25px;">
                <div style="margin-bottom: 20px;">
                  <p style="font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; font-weight: 600;">Contact</p>
                  <p style="margin: 0; color: #333; font-size: 1rem;"><i class="fas fa-phone-alt" style="color: var(--forest); width: 20px;"></i> ${user.phone || 'Not provided'}</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                  <p style="font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; font-weight: 600;">Address</p>
                  <div style="color: #333; font-size: 0.95rem; line-height: 1.5;">
                    ${hasAddress ? `
                      <p style="margin: 0;"><i class="fas fa-map-marker-alt" style="color: var(--forest); width: 20px;"></i> 
                        ${address.addressLine1} ${address.addressLine2 ? ', ' + address.addressLine2 : ''}
                      </p>
                      <p style="margin: 3px 0 0 20px;">${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}</p>
                    ` : '<p style="margin: 0; color: #666; font-style: italic;">No address saved.</p>'}
                  </div>
                </div>
                
                <button id="logoutBtn" style="width: 100%; padding: 12px; background: #fff; color: #e74c3c; border: 1px solid #e74c3c; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                  <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </div>
            </div>

            <!-- EDIT MODE -->
            <div id="profileEditMode" style="display: none;">
              <div style="background: var(--cream); padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.2rem; color: var(--forest);">Edit Profile</h3>
                <button id="cancelEditBtn" style="background: none; border: none; font-size: 1.2rem; color: #888; cursor: pointer;"><i class="fas fa-times"></i></button>
              </div>
              <form id="editProfileForm" style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                  <h4 style="font-size: 0.9rem; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: var(--forest);">Personal Info</h4>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">First Name *</label>
                    <input type="text" id="editFirstName" value="${user.firstName || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Last Name *</label>
                    <input type="text" id="editLastName" value="${user.lastName || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Email *</label>
                    <input type="email" id="editEmail" value="${user.email || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Phone Number (Optional)</label>
                    <input type="tel" id="editPhone" value="${user.phone || ''}" placeholder="10-digit number" pattern="[6-9][0-9]{9}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">New Password (leave blank to keep current)</label>
                    <input type="password" id="editPassword" placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                </div>

                <div style="margin-bottom: 20px;">
                  <h4 style="font-size: 0.9rem; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: var(--forest);">Address</h4>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Address Line 1 *</label>
                    <input type="text" id="editAddress" value="${address.addressLine1 || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Landmark (Optional)</label>
                    <input type="text" id="editLandmark" value="${address.addressLine2 || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                  <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div class="form-group" style="flex: 1;">
                      <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">City *</label>
                      <input type="text" id="editCity" value="${address.city || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                    </div>
                    <div class="form-group" style="flex: 1;">
                      <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">State *</label>
                      <input type="text" id="editState" value="${address.state || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                    </div>
                  </div>
                  <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Pincode *</label>
                    <input type="text" id="editPincode" value="${address.pincode || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" />
                  </div>
                </div>
                
                <button type="submit" id="saveProfileBtn" style="width: 100%; padding: 12px; background: var(--forest); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 10px;">
                  Save Changes
                </button>
                <div id="editAlert" style="display:none; margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 0.85rem;"></div>
              </form>
            </div>
            
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('userProfileModal');
        const overlay = document.getElementById('userProfileOverlay');
        const closeBtn = document.getElementById('closeProfileModal');
        const logoutBtn = document.getElementById('logoutBtn');
        const editProfileBtn = document.getElementById('editProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const viewMode = document.getElementById('profileViewMode');
        const editMode = document.getElementById('profileEditMode');
        const editForm = document.getElementById('editProfileForm');
        const editAlert = document.getElementById('editAlert');

        const closeProfile = () => {
          modal.style.opacity = '0';
          modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
          overlay.style.opacity = '0';
          setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            // Reset to view mode
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
          }, 300);
        };

        closeBtn.addEventListener('click', closeProfile);
        overlay.addEventListener('click', closeProfile);
        
        editProfileBtn.addEventListener('click', () => {
          viewMode.style.display = 'none';
          editMode.style.display = 'block';
          editAlert.style.display = 'none';
          // Ensure modal is scrolled to top when entering edit mode
          modal.scrollTop = 0;
        });

        cancelEditBtn.addEventListener('click', (e) => {
          e.preventDefault();
          viewMode.style.display = 'block';
          editMode.style.display = 'none';
        });

        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('saveProfileBtn');
          const originalText = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
          btn.disabled = true;
          
          const profilePayload = {
            firstName: document.getElementById('editFirstName').value.trim(),
            lastName: document.getElementById('editLastName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
          };
          
          const phone = document.getElementById('editPhone').value.trim();
          if (phone) profilePayload.phone = phone;
          
          const password = document.getElementById('editPassword').value;
          if (password) profilePayload.password = password;
          
          const addressPayload = {
            fullName: `${profilePayload.firstName} ${profilePayload.lastName}`,
            phone: phone || '',
            addressLine1: document.getElementById('editAddress').value.trim(),
            addressLine2: document.getElementById('editLandmark').value.trim(),
            city: document.getElementById('editCity').value.trim(),
            state: document.getElementById('editState').value.trim(),
            pincode: document.getElementById('editPincode').value.trim(),
            isDefault: true
          };
          
          try {
            // Update Profile
            const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(profilePayload)
            });
            const profileData = await profileRes.json();
            if (!profileRes.ok) throw new Error(profileData.errors?.[0]?.message || profileData.message || 'Failed to update profile');
            
            // Update or Create Address
            let addressRes;
            if (hasAddress && address._id) {
              addressRes = await fetch(`${API_BASE_URL}/users/addresses/${address._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(addressPayload)
              });
            } else {
              addressRes = await fetch(`${API_BASE_URL}/users/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(addressPayload)
              });
            }
            const addressData = await addressRes.json();
            if (!addressRes.ok) throw new Error(addressData.errors?.[0]?.message || addressData.message || 'Failed to update address');
            
            // Re-fetch full user object to ensure everything is in sync
            const fetchUserRes = await fetch(`${API_BASE_URL}/users/profile`, {
               headers: { 'Authorization': `Bearer ${token}` }
            });
            const fetchUserData = await fetchUserRes.json();
            if (fetchUserRes.ok) {
               localStorage.setItem('user', JSON.stringify(fetchUserData.data));
            }
            
            editAlert.style.display = 'block';
            editAlert.style.backgroundColor = '#d4edda';
            editAlert.style.color = '#155724';
            editAlert.innerText = 'Profile updated successfully!';
            
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
          } catch (err) {
            editAlert.style.display = 'block';
            editAlert.style.backgroundColor = '#f8d7da';
            editAlert.style.color = '#721c24';
            editAlert.innerText = err.message;
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        });

        logoutBtn.addEventListener('click', async () => {
          const originalText = logoutBtn.innerHTML;
          logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing Out...';
          logoutBtn.disabled = true;
          logoutBtn.style.opacity = '0.7';

          try {
            // Call backend logout to invalidate session on server
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (err) {
            console.error('Server logout failed:', err);
          }
          
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = 'index.html'; // Redirect to home so auth state clears properly
          
          // Force reload fallback in case page doesn't refresh automatically
          setTimeout(() => {
            window.location.reload();
          }, 100);
        });
      }

      accountIcons.forEach(icon => {
        icon.href = '#';
        // Remove standard nav-icon styling so it fits text nicely
        icon.style.textDecoration = 'none';
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.gap = '10px';
        icon.style.width = 'auto'; // allow it to stretch for text
        icon.classList.remove('nav-icon');
        
        icon.innerHTML = `
          <div class="user-avatar" style="width: 35px; height: 35px; background: var(--forest); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.2);" title="Profile (${user.firstName})">
            ${user.firstName.charAt(0).toUpperCase()}
          </div>
        `;
        
        icon.addEventListener('click', (e) => {
          e.preventDefault();
          const modal = document.getElementById('userProfileModal');
          const overlay = document.getElementById('userProfileOverlay');
          
          overlay.style.display = 'block';
          modal.style.display = 'block';
          
          // Trigger reflow
          void modal.offsetWidth;
          
          overlay.style.opacity = '1';
          modal.style.opacity = '1';
          modal.style.transform = 'translate(-50%, -50%) scale(1)';
        });
      });
    } else {
      accountIcons.forEach(icon => {
        icon.href = 'login.html';
        icon.innerHTML = '<i class="far fa-user"></i>';
      });
    }
  };

  // Call updateNavbar if we're not on auth pages
  if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
    updateNavbar();
  }

  // Handle dynamically appending query parameters to the register link if present on login page
  if (window.location.pathname.includes('login.html')) {
    const registerLink = document.querySelector('.auth-footer a[href="register.html"]');
    if (registerLink && window.location.search) {
      registerLink.href = 'register.html' + window.location.search;
    }
  }

  // Synchronize user logout instantly across multiple open tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'accessToken' && !e.newValue) {
      window.location.reload();
    }
  });
});
