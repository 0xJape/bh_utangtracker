import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Landing from './Landing'
import './App.css'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [newUser, setNewUser] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [fromUser, setFromUser] = useState('')
  const [toUser, setToUser] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [transactionMode, setTransactionMode] = useState('single') // 'single' or 'batch'
  const [batchTransactions, setBatchTransactions] = useState([
    { toUser: '', amount: '', description: '' }
  ])
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editProfilePic, setEditProfilePic] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [batchMode, setBatchMode] = useState('paying') // 'paying' or 'lending'

  useEffect(() => {
    if (!showLanding) {
      fetchUsers()
      fetchTransactions()
    }
  }, [showLanding])

  // Check for saved login after landing
  useEffect(() => {
    if (!showLanding && users.length > 0 && !currentUser) {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        const user = users.find(u => u.id === parsed.id)
        if (user) {
          setCurrentUser(user)
        }
      }
    }
  }, [showLanding, users, currentUser])

  // Sync currentUser with updated users data
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updatedUser = users.find(u => u.id === currentUser.id)
      if (updatedUser && (updatedUser.profile_pic !== currentUser.profile_pic || updatedUser.name !== currentUser.name)) {
        setCurrentUser(updatedUser)
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')
      
      if (error) throw error
      console.log('Fetched users:', data)
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  async function addUser(e) {
    e.preventDefault()
    if (!newUser.trim() || !newPassword.trim()) {
      alert('Please enter both name and password')
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .insert([{ name: newUser.trim(), password: newPassword.trim() }])
      
      if (error) throw error
      setNewUser('')
      setNewPassword('')
      setShowAddUser(false)
      fetchUsers()
      alert('User added successfully!')
    } catch (error) {
      alert('Error adding user: ' + error.message)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!selectedUser || !password.trim()) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', selectedUser.id)
        .eq('password', password.trim())
        .single()

      if (error || !data) {
        alert('Incorrect password!')
        setPassword('')
        return
      }

      setCurrentUser(data)
      localStorage.setItem('currentUser', JSON.stringify(data))
      setSelectedUser(null)
      setPassword('')
    } catch (error) {
      alert('Incorrect password!')
      setPassword('')
    }
  }

  async function addTransaction(e) {
    e.preventDefault()
    if (!fromUser || !toUser || !amount) return
    if (fromUser === toUser) {
      alert('Cannot create transaction to yourself!')
      return
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          from_user: fromUser,
          to_user: toUser,
          amount: parseFloat(amount),
          description: description.trim() || null
        }])
      
      if (error) throw error
      setFromUser('')
      setToUser('')
      setAmount('')
      setDescription('')
      fetchTransactions()
    } catch (error) {
      alert('Error adding transaction: ' + error.message)
    }
  }

  async function addBatchTransactions(e) {
    e.preventDefault()
    
    // Filter valid transactions
    const validTransactions = batchTransactions.filter(t => 
      t.toUser && t.amount && parseFloat(t.amount) > 0 && t.toUser !== currentUser.id
    )

    if (validTransactions.length === 0) {
      alert('Please add at least one valid transaction')
      return
    }

    try {
      let transactionsToInsert
      
      if (batchMode === 'lending') {
        // Current user lent money to multiple people (they owe current user)
        transactionsToInsert = validTransactions.map(t => ({
          from_user: currentUser.id,
          to_user: t.toUser,
          amount: parseFloat(t.amount),
          description: t.description.trim() || null
        }))
      } else {
        // Current user is paying back multiple people (current user owes them)
        transactionsToInsert = validTransactions.map(t => ({
          from_user: t.toUser,
          to_user: currentUser.id,
          amount: parseFloat(t.amount),
          description: t.description.trim() || null
        }))
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
      
      if (error) throw error
      
      setBatchTransactions([{ toUser: '', amount: '', description: '' }])
      fetchTransactions()
      const actionWord = batchMode === 'lending' ? 'loan(s)' : 'payment(s)'
      alert(`${validTransactions.length} ${actionWord} recorded successfully!`)
    } catch (error) {
      alert('Error adding transactions: ' + error.message)
    }
  }

  function addBatchRow() {
    setBatchTransactions([...batchTransactions, { toUser: '', amount: '', description: '' }])
  }

  function removeBatchRow(index) {
    if (batchTransactions.length > 1) {
      setBatchTransactions(batchTransactions.filter((_, i) => i !== index))
    }
  }

  function updateBatchRow(index, field, value) {
    const updated = [...batchTransactions]
    updated[index][field] = value
    setBatchTransactions(updated)
  }

  function quickAddOwedToMe(userId) {
    setFromUser(currentUser.id)
    setToUser(userId)
    setTransactionMode('single')
  }

  function calculateBalance(userId) {
    let balance = 0
    transactions.forEach(t => {
      if (t.from_user === userId) {
        balance += t.amount // They lent money (owed to them)
      }
      if (t.to_user === userId) {
        balance -= t.amount // They borrowed money (they owe)
      }
    })
    return balance
  }

  // Calculate debt between current user and another user
  function calculateDebtBetweenUsers(otherUserId) {
    let balance = 0
    transactions.forEach(t => {
      // Current user lent money to the other user
      if (t.from_user === currentUser.id && t.to_user === otherUserId) {
        balance += t.amount // Other user owes current user
      }
      // Other user lent money to current user
      if (t.from_user === otherUserId && t.to_user === currentUser.id) {
        balance -= t.amount // Current user owes other user
      }
    })
    return balance
  }

  function getUserName(userId) {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Unknown'
  }

  function handleLogout() {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    setPassword('')
  }

  function selectUser(user) {
    setSelectedUser(user)
    setPassword('')
  }

  function cancelLogin() {
    setSelectedUser(null)
    setPassword('')
  }

  function openEditProfile() {
    setEditName(currentUser.name)
    setEditPassword('')
    setConfirmPassword('')
    setEditProfilePic(currentUser.profile_pic || '')
    setShowEditProfile(true)
  }

  function closeEditProfile() {
    setShowEditProfile(false)
    setEditName('')
    setEditPassword('')
    setConfirmPassword('')
    setEditProfilePic('')
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    
    if (editPassword && editPassword !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (!editName.trim()) {
      alert('Name cannot be empty')
      return
    }

    try {
      const updateData = {
        name: editName.trim(),
        profile_pic: editProfilePic.trim() || null
      }

      if (editPassword) {
        updateData.password = editPassword.trim()
      }

      console.log('Updating profile with data:', updateData)
      console.log('Current user ID:', currentUser.id)

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select()

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      console.log('Update successful:', data)

      const updatedUser = { ...currentUser, ...updateData }
      setCurrentUser(updatedUser)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      
      // Fetch updated users list to refresh all avatars
      await fetchUsers()
      
      closeEditProfile()
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update failed:', error)
      alert('Error updating profile: ' + error.message + '\n\nMake sure you ran the SQL migration in Supabase!')
    }
  }

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // Login screen
  if (!currentUser) {
    // Password input modal
    if (selectedUser) {
      return (
        <div className="app">
          <div className="modal-overlay-minimal">
            <div className="modal-minimal">
              <div className="modal-user-header">
                {selectedUser.profile_pic ? (
                  <img src={selectedUser.profile_pic} alt={selectedUser.name} className="modal-user-avatar" />
                ) : (
                  <div className="modal-user-avatar">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2>Welcome back, {selectedUser.name}</h2>
                <p>Enter your password to continue</p>
              </div>
              <form onSubmit={handleLogin} className="modal-form-minimal">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-minimal"
                  autoFocus
                  required
                />
                <div className="modal-actions-minimal">
                  <button type="button" onClick={cancelLogin} className="btn-minimal-secondary">
                    Back
                  </button>
                  <button type="submit" className="btn-minimal-primary">
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )
    }

    // Add user modal
    if (showAddUser) {
      return (
        <div className="app">
          <div className="modal-overlay-minimal">
            <div className="modal-minimal">
              <div className="modal-user-header">
                <div className="modal-user-avatar add-user-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2>Add New User</h2>
                <p>Create a new account for a boarder</p>
              </div>
              <form onSubmit={addUser} className="modal-form-minimal">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  className="input-minimal"
                  autoFocus
                  required
                />
                <input
                  type="password"
                  placeholder="Create Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-minimal"
                  required
                />
                <div className="modal-actions-minimal">
                  <button type="button" onClick={() => setShowAddUser(false)} className="btn-minimal-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-minimal-primary">
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="app login-screen-minimal">
        <div className="login-minimal-container">
          <button className="back-to-landing" onClick={() => setShowLanding(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="login-minimal-header">
            <div className="brand-mark-small">
              <span>BH</span>
            </div>
            <h1>Select Your Profile</h1>
            <p>Choose your account to continue</p>
          </div>
          
          {users.length === 0 ? (
            <div className="empty-state-minimal">
              <p>No users yet. Add your apartment-mates to get started!</p>
              <button onClick={() => setShowAddUser(true)} className="btn-minimal-primary">
                Add First User
              </button>
            </div>
          ) : (
            <>
              <div className="user-grid-minimal">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="user-card-minimal"
                  >
                    {user.profile_pic ? (
                      <img src={user.profile_pic} alt={user.name} className="user-avatar-minimal user-avatar-img-minimal" />
                    ) : (
                      <div className="user-avatar-minimal">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="user-name-minimal">{user.name}</div>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="arrow-icon">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
              
              <button onClick={() => setShowAddUser(true)} className="btn-add-user-minimal">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add New User
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Dashboard
  const myBalance = calculateBalance(currentUser.id)
  const myTransactions = transactions.filter(t => 
    t.from_user === currentUser.id || t.to_user === currentUser.id
  )

  return (
    <div className="app dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Utang Tracker</h1>
          <div className="user-info-header">
            {currentUser.profile_pic ? (
              <img src={currentUser.profile_pic} alt={currentUser.name} className="user-avatar-header" />
            ) : (
              <div className="user-avatar-header">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="user-badge">{currentUser.name}</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={openEditProfile} className="btn-edit-profile">
            <span>⚙️ Profile</span>
          </button>
          <button onClick={handleLogout} className="btn-logout-modern">
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay">
          <div className="modal modal-profile">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button onClick={closeEditProfile} className="close-btn">×</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="modal-form">
              <div className="profile-pic-section">
                {editProfilePic ? (
                  <img src={editProfilePic} alt="Profile" className="profile-pic-preview" />
                ) : (
                  <div className="profile-pic-preview profile-pic-placeholder">
                    {editName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Profile Picture URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/your-photo.jpg"
                  value={editProfilePic}
                  onChange={(e) => setEditProfilePic(e.target.value)}
                  className="input-modern"
                />
                <small className="form-hint">Enter a direct link to your profile picture</small>
              </div>

              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-modern"
                  required
                />
              </div>

              <div className="form-divider">
                <span>Change Password (Optional)</span>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="input-modern"
                />
              </div>

              {editPassword && (
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-modern"
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeEditProfile} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="dashboard-content">
        {/* My Balance Card */}
        <div className="balance-summary-card">
          <div className="balance-label">Your Balance</div>
          <div className={`balance-amount ${myBalance >= 0 ? 'positive' : 'negative'}`}>
            ₱{Math.abs(myBalance).toFixed(2)}
          </div>
          <div className="balance-status">
            {myBalance > 0 ? '🎉 You are owed money' : myBalance < 0 ? '💸 You owe money' : '✅ All settled'}
          </div>
        </div>

        {/* Who Owes Me / Who I Owe */}
        <div className="card">
          <h2 className="card-title">💰 People Who Owe Me</h2>
          <div className="balance-grid">
            {users
              .filter(user => {
                if (user.id === currentUser.id) return false
                const debt = calculateDebtBetweenUsers(user.id)
                // Positive debt means they owe me
                return debt > 0
              })
              .map(user => {
                const debt = calculateDebtBetweenUsers(user.id)
                return (
                  <div key={user.id} className="balance-item balance-item-owed">
                    <div className="balance-item-user">
                      {user.profile_pic ? (
                        <img src={user.profile_pic} alt={user.name} className="mini-avatar mini-avatar-img" />
                      ) : (
                        <div className="mini-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="balance-item-name">{user.name}</span>
                    </div>
                    <div className="balance-item-amount positive">
                      ₱{debt.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            {users.filter(user => user.id !== currentUser.id && calculateDebtBetweenUsers(user.id) > 0).length === 0 && (
              <div className="empty-state-small">No one owes you money 🎉</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">💸 People I Owe</h2>
          <div className="balance-grid">
            {users
              .filter(user => {
                if (user.id === currentUser.id) return false
                const debt = calculateDebtBetweenUsers(user.id)
                // Negative debt means I owe them
                return debt < 0
              })
              .map(user => {
                const debt = calculateDebtBetweenUsers(user.id)
                return (
                  <div key={user.id} className="balance-item balance-item-owing">
                    <div className="balance-item-user">
                      {user.profile_pic ? (
                        <img src={user.profile_pic} alt={user.name} className="mini-avatar mini-avatar-img" />
                      ) : (
                        <div className="mini-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="balance-item-name">{user.name}</span>
                    </div>
                    <div className="balance-item-amount negative">
                      ₱{Math.abs(debt).toFixed(2)}
                    </div>
                  </div>
                )
              })}
            {users.filter(user => user.id !== currentUser.id && calculateDebtBetweenUsers(user.id) < 0).length === 0 && (
              <div className="empty-state-small">You don't owe anyone 🎉</div>
            )}
          </div>
        </div>

        {/* All Balances */}
        <div className="card">
          <h2 className="card-title">Everyone's Balance</h2>
          <div className="balance-grid">
            {users.map(user => {
              const balance = calculateBalance(user.id)
              return (
                <div key={user.id} className="balance-item">
                  <div className="balance-item-user">
                    {user.profile_pic ? (
                      <img src={user.profile_pic} alt={user.name} className="mini-avatar mini-avatar-img" />
                    ) : (
                      <div className="mini-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="balance-item-name">{user.name}</span>
                  </div>
                  <div className={`balance-item-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                    {balance >= 0 ? '+' : ''}₱{balance.toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Transaction */}
        <div className="card">
          <div className="card-header-with-tabs">
            <h2 className="card-title">New Transaction</h2>
            <div className="mode-tabs">
              <button 
                type="button"
                className={`mode-tab ${transactionMode === 'single' ? 'active' : ''}`}
                onClick={() => setTransactionMode('single')}
              >
                Single
              </button>
              <button 
                type="button"
                className={`mode-tab ${transactionMode === 'batch' ? 'active' : ''}`}
                onClick={() => setTransactionMode('batch')}
              >
                Batch Add
              </button>
            </div>
          </div>

          {transactionMode === 'single' ? (
            <form onSubmit={addTransaction} className="transaction-form">
              <div className="quick-add-section">
                <div className="quick-add-label">Quick add:</div>
                <div className="quick-add-buttons">
                  <button 
                    type="button"
                    className="btn-quick"
                    onClick={() => {
                      setFromUser(currentUser.id)
                      setToUser('')
                    }}
                  >
                    💸 I lent money (someone owes me)
                  </button>
                  <button 
                    type="button"
                    className="btn-quick"
                    onClick={() => {
                      setFromUser('')
                      setToUser(currentUser.id)
                    }}
                  >
                    📥 I borrowed money (I owe someone)
                  </button>
                </div>
              </div>

              <div className="form-row">
                <select
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                  className="input-modern"
                  required
                >
                  <option value="">Who paid?</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <select
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                  className="input-modern"
                  required
                >
                  <option value="">For whom?</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Amount (₱)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-modern"
                  step="0.01"
                  min="0.01"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-modern"
                />
              </div>
              <button type="submit" className="btn-submit">Record Transaction</button>
            </form>
          ) : (
            <form onSubmit={addBatchTransactions} className="transaction-form">
              <div className="batch-mode-selector">
                <button
                  type="button"
                  className={`batch-mode-btn ${batchMode === 'lending' ? 'active' : ''}`}
                  onClick={() => setBatchMode('lending')}
                >
                  💸 I Lent to Multiple People
                </button>
                <button
                  type="button"
                  className={`batch-mode-btn ${batchMode === 'paying' ? 'active' : ''}`}
                  onClick={() => setBatchMode('paying')}
                >
                  💰 I'm Paying Multiple People
                </button>
              </div>

              <div className="batch-info">
                <span>
                  {batchMode === 'lending' 
                    ? `You (${currentUser.name}) lent money to multiple people:` 
                    : `You (${currentUser.name}) are paying back multiple people:`}
                </span>
              </div>
              
              <div className="batch-list">
                {batchTransactions.map((transaction, index) => (
                  <div key={index} className="batch-row">
                    <div className="batch-number">{index + 1}</div>
                    <select
                      value={transaction.toUser}
                      onChange={(e) => updateBatchRow(index, 'toUser', e.target.value)}
                      className="input-modern batch-input"
                      required
                    >
                      <option value="">
                        {batchMode === 'lending' ? 'Lent to...' : 'Paying to...'}
                      </option>
                      {users.filter(u => u.id !== currentUser.id).map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="₱ Amount"
                      value={transaction.amount}
                      onChange={(e) => updateBatchRow(index, 'amount', e.target.value)}
                      className="input-modern batch-input"
                      step="0.01"
                      min="0.01"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={transaction.description}
                      onChange={(e) => updateBatchRow(index, 'description', e.target.value)}
                      className="input-modern batch-input batch-desc"
                    />
                    {batchTransactions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatchRow(index)}
                        className="btn-remove-batch"
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="batch-actions">
                <button 
                  type="button" 
                  onClick={addBatchRow} 
                  className="btn-secondary"
                >
                  + Add Another Person
                </button>
                <button type="submit" className="btn-submit">
                  Record {batchTransactions.filter(t => t.toUser && t.amount).length} {batchMode === 'lending' ? 'Loan(s)' : 'Payment(s)'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="card-title">Recent Activity</h2>
          {myTransactions.length === 0 ? (
            <div className="empty-state-small">No transactions yet</div>
          ) : (
            <div className="transaction-list">
              {myTransactions.slice(0, 10).map(t => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-icon">
                    {t.from_user === currentUser.id ? '📤' : '📥'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-parties">
                      <span className="party-from">{getUserName(t.from_user)}</span>
                      <span className="arrow-small">→</span>
                      <span className="party-to">{getUserName(t.to_user)}</span>
                    </div>
                    <div className="transaction-meta">
                      {t.description && <span className="transaction-desc">{t.description}</span>}
                      <span className="transaction-time">
                        {new Date(t.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={`transaction-amount ${t.from_user === currentUser.id ? 'out' : 'in'}`}>
                    {t.from_user === currentUser.id ? '+' : '-'}₱{t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
