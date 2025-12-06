import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Landing from './Landing'
import './App.css'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [groups, setGroups] = useState([])
  const [groupCode, setGroupCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [showGroupSelection, setShowGroupSelection] = useState(false)
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const [selectedGroupToJoin, setSelectedGroupToJoin] = useState(null)
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
  const [paymentUserId, setPaymentUserId] = useState(null) // User ID for whom payment is being made
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [paymentOwingUserId, setPaymentOwingUserId] = useState(null) // User ID for whom you're making a payment (you owe them)
  const [paymentOwingAmount, setPaymentOwingAmount] = useState('')
  const [paymentOwingDescription, setPaymentOwingDescription] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState('') // Payment proof for people who owe you
  const [paymentOwingProofUrl, setPaymentOwingProofUrl] = useState('') // Payment proof for people you owe
  const [editGcashNumber, setEditGcashNumber] = useState('')
  const [editGcashQr, setEditGcashQr] = useState('')

  // Check on initial mount if we should skip landing
  useEffect(() => {
    const savedGroup = localStorage.getItem('currentGroup')
    if (savedGroup) {
      setShowLanding(false)
    }
  }, [])

  // Add keyboard shortcut to reset app (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        if (window.confirm('Reset app and clear all data? You will return to the landing page.')) {
          localStorage.clear()
          window.location.reload()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (!showLanding) {
      checkSavedGroup()
    }
  }, [showLanding])

  useEffect(() => {
    if (currentGroup) {
      fetchUsers()
      fetchTransactions()
    }
  }, [currentGroup])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showGroupDropdown && !e.target.closest('.group-selector')) {
        setShowGroupDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showGroupDropdown])

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

  // Group Management Functions
  async function checkSavedGroup() {
    const savedGroup = localStorage.getItem('currentGroup')
    if (savedGroup) {
      try {
        const group = JSON.parse(savedGroup)
        // Verify the group still exists in the database
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', group.id)
          .single()
        
        if (error || !data) {
          // Group doesn't exist anymore, clear it
          localStorage.removeItem('currentGroup')
          setShowGroupSelection(true)
        } else {
          setCurrentGroup(data)
        }
      } catch (err) {
        console.error('Error checking saved group:', err)
        localStorage.removeItem('currentGroup')
        setShowGroupSelection(true)
      }
    } else {
      setShowGroupSelection(true)
    }
    // Fetch all groups the user has access to
    await fetchUserGroups()
  }

  async function fetchUserGroups() {
    try {
      // Fetch ALL groups from the database to show on selection page
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setGroups(data || [])
      
      // Update localStorage with all group IDs
      if (data && data.length > 0) {
        const groupIds = data.map(g => g.id)
        localStorage.setItem('userGroups', JSON.stringify(groupIds))
      }
    } catch (error) {
      console.error('Error fetching user groups:', error)
    }
  }

  async function createGroup(e) {
    e.preventDefault()
    try {
      // Generate unique group code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name: newGroupName, code }])
        .select()
        .single()
      
      if (error) throw error
      
      // Add to user's groups list
      const savedGroupsStr = localStorage.getItem('userGroups')
      const savedGroups = savedGroupsStr ? JSON.parse(savedGroupsStr) : []
      if (!savedGroups.includes(data.id)) {
        savedGroups.push(data.id)
        localStorage.setItem('userGroups', JSON.stringify(savedGroups))
      }
      
      setCurrentGroup(data)
      localStorage.setItem('currentGroup', JSON.stringify(data))
      setShowGroupSelection(false)
      setNewGroupName('')
      await fetchUserGroups()
      alert(`Group created! Share this code with your group: ${data.code}`)
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Error creating group: ' + error.message)
    }
  }

  async function joinGroup(e) {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('code', groupCode.toUpperCase())
        .single()
      
      if (error) throw error
      
      if (!data) {
        alert('Invalid group code!')
        return
      }
      
      // Add to user's groups list
      const savedGroupsStr = localStorage.getItem('userGroups')
      const savedGroups = savedGroupsStr ? JSON.parse(savedGroupsStr) : []
      if (!savedGroups.includes(data.id)) {
        savedGroups.push(data.id)
        localStorage.setItem('userGroups', JSON.stringify(savedGroups))
      }
      
      setCurrentGroup(data)
      localStorage.setItem('currentGroup', JSON.stringify(data))
      setShowGroupSelection(false)
      setGroupCode('')
      await fetchUserGroups()
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Invalid group code!')
    }
  }

  function switchGroup() {
    setCurrentGroup(null)
    setCurrentUser(null)
    localStorage.removeItem('currentGroup')
    localStorage.removeItem('currentUser')
    setShowGroupSelection(true)
  }

  function selectGroup(group) {
    setCurrentGroup(group)
    setCurrentUser(null)
    localStorage.setItem('currentGroup', JSON.stringify(group))
    localStorage.removeItem('currentUser')
    setShowGroupDropdown(false)
  }

  function selectGroupFromList(group) {
    setSelectedGroupToJoin(group)
    setGroupCode('')
  }

  function cancelGroupSelection() {
    setSelectedGroupToJoin(null)
    setGroupCode('')
  }

  async function verifyAndJoinGroup(e) {
    e.preventDefault()
    if (!selectedGroupToJoin) return
    
    if (groupCode.toUpperCase() === selectedGroupToJoin.code) {
      setCurrentGroup(selectedGroupToJoin)
      localStorage.setItem('currentGroup', JSON.stringify(selectedGroupToJoin))
      setShowGroupSelection(false)
      setSelectedGroupToJoin(null)
      setGroupCode('')
    } else {
      alert('Incorrect group code! Please try again.')
      setGroupCode('')
    }
  }

  async function fetchUsers() {
    if (!currentGroup) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', currentGroup.id)
        .order('name')
      
      if (error) {
        // Check if error is due to missing group_id column (migration not run yet)
        if (error.message && error.message.includes('group_id')) {
          console.error('Database migration needed! Run database-schema-groups.sql and migrate-existing-data.sql')
          alert('Database migration required! Please run the migration scripts first.\n\nSee MIGRATION_GUIDE.md for instructions.')
          setShowGroupSelection(false)
          setShowLanding(true)
          setLoading(false)
          return
        }
        throw error
      }
      
      console.log('Fetched users:', data)
      setUsers(data || [])
      
      // If no users found in this group, inform the user
      if (!data || data.length === 0) {
        console.warn('No users found for this group. You may need to add users or run the migration.')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Error loading users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTransactions() {
    if (!currentGroup) return
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('group_id', currentGroup.id)
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
        .insert([{ 
          name: newUser.trim(), 
          password: newPassword.trim(),
          group_id: currentGroup.id
        }])
      
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
          description: description.trim() || null,
          group_id: currentGroup.id
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
          description: t.description.trim() || null,
          group_id: currentGroup.id
        }))
      } else {
        // Current user is paying back multiple people (current user owes them)
        transactionsToInsert = validTransactions.map(t => ({
          from_user: t.toUser,
          to_user: currentUser.id,
          amount: parseFloat(t.amount),
          description: t.description.trim() || null,
          group_id: currentGroup.id
        }))
      }

      const { error} = await supabase
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

  function togglePayment(userId) {
    if (paymentUserId === userId) {
      setPaymentUserId(null)
      setPaymentAmount('')
      setPaymentDescription('')
      setPaymentProofUrl('')
    } else {
      setPaymentUserId(userId)
      setPaymentAmount('')
      setPaymentDescription('')
      setPaymentProofUrl('')
    }
  }

  async function handlePayment(userId) {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    const debt = calculateDebtBetweenUsers(userId)
    const payAmount = parseFloat(paymentAmount)

    if (payAmount > debt) {
      alert(`Payment amount cannot exceed the debt of ₱${debt.toFixed(2)}`)
      return
    }

    try {
      // Create a transaction where the debtor (userId) pays back the current user
      // This reduces the debt by the payment amount
      const { error } = await supabase
        .from('transactions')
        .insert([{
          from_user: userId, // Person who owes is paying
          to_user: currentUser.id, // Current user receives payment
          amount: payAmount,
          description: paymentDescription.trim() || 'Payment',
          proof_url: paymentProofUrl.trim() || null,
          group_id: currentGroup.id
        }])
      
      if (error) throw error
      
      setPaymentUserId(null)
      setPaymentAmount('')
      setPaymentDescription('')
      setPaymentProofUrl('')
      fetchTransactions()
      alert(`Payment of ₱${payAmount.toFixed(2)} recorded successfully!`)
    } catch (error) {
      alert('Error recording payment: ' + error.message)
    }
  }

  function togglePaymentOwing(userId) {
    if (paymentOwingUserId === userId) {
      setPaymentOwingUserId(null)
      setPaymentOwingAmount('')
      setPaymentOwingDescription('')
      setPaymentOwingProofUrl('')
    } else {
      setPaymentOwingUserId(userId)
      setPaymentOwingAmount('')
      setPaymentOwingDescription('')
      setPaymentOwingProofUrl('')
    }
  }

  async function handlePaymentOwing(userId) {
    if (!paymentOwingAmount || parseFloat(paymentOwingAmount) <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    const debt = calculateDebtBetweenUsers(userId)
    const payAmount = parseFloat(paymentOwingAmount)

    // For people you owe, debt is negative, so we check absolute value
    if (payAmount > Math.abs(debt)) {
      alert(`Payment amount cannot exceed the debt of ₱${Math.abs(debt).toFixed(2)}`)
      return
    }

    try {
      // Create a transaction where current user pays back the person they owe
      // This reduces what current user owes by the payment amount
      const { error } = await supabase
        .from('transactions')
        .insert([{
          from_user: currentUser.id, // Current user is paying
          to_user: userId, // Person being paid
          amount: payAmount,
          description: paymentOwingDescription.trim() || 'Payment',
          proof_url: paymentOwingProofUrl.trim() || null,
          group_id: currentGroup.id
        }])
      
      if (error) throw error
      
      setPaymentOwingUserId(null)
      setPaymentOwingAmount('')
      setPaymentOwingDescription('')
      setPaymentOwingProofUrl('')
      fetchTransactions()
      alert(`Payment of ₱${payAmount.toFixed(2)} recorded successfully!`)
    } catch (error) {
      alert('Error recording payment: ' + error.message)
    }
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
    setCurrentGroup(null)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentGroup')
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
    setEditGcashNumber(currentUser.gcash_number || '')
    setEditGcashQr(currentUser.gcash_qr || '')
    setShowEditProfile(true)
  }

  function closeEditProfile() {
    setShowEditProfile(false)
    setEditName('')
    setEditPassword('')
    setConfirmPassword('')
    setEditProfilePic('')
    setEditGcashNumber('')
    setEditGcashQr('')
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
        profile_pic: editProfilePic.trim() || null,
        gcash_number: editGcashNumber.trim() || null,
        gcash_qr: editGcashQr.trim() || null
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

  // Group Selection Screen
  if (showGroupSelection) {
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
            <h1>Select Your Group</h1>
            <p>Create a new group or join an existing one</p>
          </div>

          {selectedGroupToJoin ? (
            <div className="group-verification-section">
              <button onClick={cancelGroupSelection} className="back-button-minimal">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <div className="group-card verification-card">
                <div className="group-card-header">
                  <div className="existing-group-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>{selectedGroupToJoin.name}</h3>
                </div>
                <p>Enter the group code to join</p>
                <form onSubmit={verifyAndJoinGroup} className="group-form">
                  <input
                    type="text"
                    placeholder="6-character group code"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    className="input-minimal"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn-minimal-primary">
                    Verify & Join
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {groups.length > 0 && (
                <div className="existing-groups-section">
                  <h3>Available Groups</h3>
                  <div className="existing-groups-list">
                    {groups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => selectGroupFromList(group)}
                        className="existing-group-item"
                      >
                        <div className="existing-group-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="existing-group-info">
                          <span className="existing-group-name">{group.name}</span>
                          <span className="existing-group-code">Requires code to join</span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="arrow-icon">
                          <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div className="section-divider">
                    <span>Or</span>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedGroupToJoin && (
            <div className="group-selection-cards single-card">
              <div className="group-card">
                <h3>Create New Group</h3>
                <p>Start a new group for your community</p>
                <form onSubmit={createGroup} className="group-form">
                  <input
                    type="text"
                    placeholder="Group Name (e.g., Capareda Boarding House)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="input-minimal"
                    required
                  />
                  <button type="submit" className="btn-minimal-primary">
                    Create Group
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
          <button className="back-to-landing" onClick={switchGroup}>
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
          <div className="header-title-group">
            <h1>Utang Tracker</h1>
            <div className="group-selector">
              <button 
                onClick={() => setShowGroupDropdown(!showGroupDropdown)} 
                className="group-badge-button"
              >
                <span className="group-info">
                  <span className="group-name">{currentGroup.name}</span>
                  <span className="group-code">Code: {currentGroup.code}</span>
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  style={{ transform: showGroupDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {showGroupDropdown && (
                <div className="group-dropdown">
                  <div className="group-dropdown-header">
                    <span>Your Groups</span>
                  </div>
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => selectGroup(group)}
                        className={`group-dropdown-item ${currentGroup.id === group.id ? 'active' : ''}`}
                      >
                        <div className="group-dropdown-info">
                          <span className="group-dropdown-name">{group.name}</span>
                          <span className="group-dropdown-code">{group.code}</span>
                        </div>
                        {currentGroup.id === group.id && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L6 11L13 4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="group-dropdown-empty">No groups yet</div>
                  )}
                  <div className="group-dropdown-divider"></div>
                  <button onClick={switchGroup} className="group-dropdown-item create-new">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Create or Join Group</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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
                <span>GCash Information (Optional)</span>
              </div>

              <div className="form-group">
                <label className="form-label">GCash Number</label>
                <input
                  type="text"
                  placeholder="09XX XXX XXXX"
                  value={editGcashNumber}
                  onChange={(e) => setEditGcashNumber(e.target.value)}
                  className="input-modern"
                />
                <small className="form-hint">Your GCash mobile number for payments</small>
              </div>

              <div className="form-group">
                <label className="form-label">GCash QR Code Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/your-gcash-qr.jpg"
                  value={editGcashQr}
                  onChange={(e) => setEditGcashQr(e.target.value)}
                  className="input-modern"
                />
                <small className="form-hint">Direct link to your GCash QR code image</small>
              </div>

              {editGcashQr && (
                <div className="form-group">
                  <label className="form-label">QR Code Preview</label>
                  <div className="gcash-qr-preview-edit">
                    <img src={editGcashQr} alt="GCash QR Preview" className="qr-image-preview" />
                  </div>
                </div>
              )}

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
                const isPaymentOpen = paymentUserId === user.id
                return (
                  <div key={user.id} className="balance-item balance-item-owed balance-item-with-payment">
                    <div className="balance-item-header">
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
                      <div className="balance-item-right">
                        <div className="balance-item-amount positive">
                          ₱{debt.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePayment(user.id)}
                          className={`btn-payment-toggle ${isPaymentOpen ? 'active' : ''}`}
                          title="Record payment"
                        >
                          {isPaymentOpen ? '✕' : '💵'}
                        </button>
                      </div>
                    </div>
                    {isPaymentOpen && (
                      <div className="payment-form">
                        <input
                          type="number"
                          placeholder="Payment amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="input-modern input-payment"
                          step="0.01"
                          min="0.01"
                          max={debt}
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                          className="input-modern input-payment"
                        />
                        <input
                          type="url"
                          placeholder="Payment proof image URL (optional)"
                          value={paymentProofUrl}
                          onChange={(e) => setPaymentProofUrl(e.target.value)}
                          className="input-modern input-payment"
                        />
                        {user.gcash_number && (
                          <div className="gcash-info">
                            <div className="gcash-label">💳 GCash Number:</div>
                            <div className="gcash-value">{user.gcash_number}</div>
                          </div>
                        )}
                        {user.gcash_qr && (
                          <div className="gcash-qr-preview">
                            <img src={user.gcash_qr} alt="GCash QR" className="qr-image" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePayment(user.id)}
                          className="btn-payment-submit"
                        >
                          Record Payment
                        </button>
                      </div>
                    )}
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
                const isPaymentOpen = paymentOwingUserId === user.id
                return (
                  <div key={user.id} className="balance-item balance-item-owing balance-item-with-payment">
                    <div className="balance-item-header">
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
                      <div className="balance-item-right">
                        <div className="balance-item-amount negative">
                          ₱{Math.abs(debt).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePaymentOwing(user.id)}
                          className={`btn-payment-toggle ${isPaymentOpen ? 'active' : ''}`}
                          title="Make payment"
                        >
                          {isPaymentOpen ? '✕' : '💵'}
                        </button>
                      </div>
                    </div>
                    {isPaymentOpen && (
                      <div className="payment-form">
                        <input
                          type="number"
                          placeholder="Payment amount"
                          value={paymentOwingAmount}
                          onChange={(e) => setPaymentOwingAmount(e.target.value)}
                          className="input-modern input-payment"
                          step="0.01"
                          min="0.01"
                          max={Math.abs(debt)}
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={paymentOwingDescription}
                          onChange={(e) => setPaymentOwingDescription(e.target.value)}
                          className="input-modern input-payment"
                        />
                        <input
                          type="url"
                          placeholder="Payment proof image URL (optional)"
                          value={paymentOwingProofUrl}
                          onChange={(e) => setPaymentOwingProofUrl(e.target.value)}
                          className="input-modern input-payment"
                        />
                        {user.gcash_number && (
                          <div className="gcash-info">
                            <div className="gcash-label">💳 GCash Number:</div>
                            <div className="gcash-value">{user.gcash_number}</div>
                          </div>
                        )}
                        {user.gcash_qr && (
                          <div className="gcash-qr-preview">
                            <img src={user.gcash_qr} alt="GCash QR" className="qr-image" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePaymentOwing(user.id)}
                          className="btn-payment-submit"
                        >
                          Make Payment
                        </button>
                      </div>
                    )}
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
                <div className="quick-add-header">
                  <div className="quick-add-icon">⚡</div>
                  <div className="quick-add-text">
                    <h3>Quick Setup</h3>
                    <p>Choose your situation to auto-fill the form</p>
                  </div>
                </div>
                <div className="quick-add-buttons">
                  <button 
                    type="button"
                    className={`btn-quick btn-quick-lent ${fromUser === currentUser.id && !toUser ? 'active' : ''}`}
                    onClick={() => {
                      setFromUser(currentUser.id)
                      setToUser('')
                    }}
                  >
                    <div className="btn-quick-icon">💰</div>
                    <div className="btn-quick-content">
                      <div className="btn-quick-title">I Lent Money</div>
                      <div className="btn-quick-subtitle">Someone owes me</div>
                    </div>
                  </button>
                  <button 
                    type="button"
                    className={`btn-quick btn-quick-borrowed ${toUser === currentUser.id && !fromUser ? 'active' : ''}`}
                    onClick={() => {
                      setFromUser('')
                      setToUser(currentUser.id)
                    }}
                  >
                    <div className="btn-quick-icon">📝</div>
                    <div className="btn-quick-content">
                      <div className="btn-quick-title">I Borrowed Money</div>
                      <div className="btn-quick-subtitle">I owe someone</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Show simplified form when quick action is selected */}
              {fromUser === currentUser.id || toUser === currentUser.id ? (
                // Quick action selected - Show only relevant field
                <>
                  <div className="form-section">
                    <div className="input-group">
                      <label className="input-label">
                        {fromUser === currentUser.id ? 'Who did you lend money to?' : 'Who did you borrow money from?'}
                      </label>
                      <select
                        value={fromUser === currentUser.id ? toUser : fromUser}
                        onChange={(e) => {
                          if (fromUser === currentUser.id) {
                            setToUser(e.target.value)
                          } else {
                            setFromUser(e.target.value)
                          }
                        }}
                        className="input-modern"
                        required
                      >
                        <option value="">Select person...</option>
                        {users.filter(u => u.id !== currentUser.id).map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                // Default - Show both fields
                <div className="form-section">
                  <div className="form-section-label">Transaction Details</div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label">Who lent the money?</label>
                      <select
                        value={fromUser}
                        onChange={(e) => setFromUser(e.target.value)}
                        className="input-modern"
                        required
                      >
                        <option value="">Select person...</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Who borrowed the money?</label>
                      <select
                        value={toUser}
                        onChange={(e) => setToUser(e.target.value)}
                        className="input-modern"
                        required
                      >
                        <option value="">Select person...</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">
                    {fromUser === currentUser.id && !toUser ? 'How much did you lend?' : 
                     toUser === currentUser.id && !fromUser ? 'How much did you borrow?' : 
                     'Amount'}
                  </label>
                  <input
                    type="number"
                    placeholder="₱ 0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-modern"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">What was it for?</label>
                  <input
                    type="text"
                    placeholder="e.g., Bills, Food, Rent..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-modern"
                  />
                </div>
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
