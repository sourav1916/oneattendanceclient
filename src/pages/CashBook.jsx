import React, { useState } from 'react';
import { 
  FaMoneyBillWave, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaFileExport,
  FaPrint,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCircle,
  FaUsers,
  FaChartLine,
  FaDownload,
  FaCalendarAlt,
  FaRegClock,
  FaRupeeSign
} from 'react-icons/fa';

const CashBook = () => {
  // Mock user data - in real app, this would come from auth context
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Rajesh Kumar',
    role: 'owner', // 'owner' or 'employee'
    email: 'rajesh@company.com',
    avatar: null
  });

  // Mock cash book entries
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '2024-01-15',
      description: 'Sales revenue - Retail',
      type: 'credit',
      amount: 50000,
      category: 'Sales',
      paymentMethod: 'Cash',
      createdBy: 'Rajesh Kumar',
      createdById: 1,
      status: 'approved',
      reference: 'INV-001',
      notes: 'Daily sales collection'
    },
    {
      id: 2,
      date: '2024-01-15',
      description: 'Office supplies purchase',
      type: 'debit',
      amount: 5000,
      category: 'Office Expenses',
      paymentMethod: 'UPI',
      createdBy: 'Priya Sharma',
      createdById: 2,
      status: 'approved',
      reference: 'EXP-001',
      notes: 'Stationery items'
    },
    {
      id: 3,
      date: '2024-01-14',
      description: 'Salary payment',
      type: 'debit',
      amount: 25000,
      category: 'Salary',
      paymentMethod: 'Bank Transfer',
      createdBy: 'Amit Patel',
      createdById: 3,
      status: 'pending',
      reference: 'SAL-001',
      notes: 'January salary'
    },
    {
      id: 4,
      date: '2024-01-14',
      description: 'Client payment received',
      type: 'credit',
      amount: 75000,
      category: 'Sales',
      paymentMethod: 'Cheque',
      createdBy: 'Rajesh Kumar',
      createdById: 1,
      status: 'approved',
      reference: 'INV-002',
      notes: 'Payment from ABC Corp'
    },
    {
      id: 5,
      date: '2024-01-13',
      description: 'Electricity bill',
      type: 'debit',
      amount: 8000,
      category: 'Utilities',
      paymentMethod: 'Net Banking',
      createdBy: 'Priya Sharma',
      createdById: 2,
      status: 'approved',
      reference: 'UTIL-001',
      notes: 'January electricity bill'
    }
  ]);

  const [filters, setFilters] = useState({
    dateRange: 'today',
    type: 'all',
    category: 'all',
    status: 'all'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Calculate totals based on user role
  const calculateTotals = () => {
    let totalCredit = 0;
    let totalDebit = 0;
    
    entries.forEach(entry => {
      if (entry.type === 'credit') {
        totalCredit += entry.amount;
      } else {
        totalDebit += entry.amount;
      }
    });
    
    return {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit
    };
  };

  const totals = calculateTotals();

  // Check if user can edit/delete entry
  const canModifyEntry = (entry) => {
    if (currentUser.role === 'owner') return true;
    return entry.createdById === currentUser.id;
  };

  // Filter entries based on user role and filters
  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    // Role-based filtering
    if (currentUser.role === 'employee') {
      filtered = filtered.filter(entry => entry.createdById === currentUser.id);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }
    
    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  const handleAddEntry = (newEntry) => {
    const entry = {
      ...newEntry,
      id: entries.length + 1,
      createdBy: currentUser.name,
      createdById: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      status: currentUser.role === 'owner' ? 'approved' : 'pending'
    };
    setEntries([entry, ...entries]);
    setShowAddModal(false);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const handleApproveEntry = (id) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, status: 'approved' } : entry
    ));
  };

  const handleRejectEntry = (id) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, status: 'rejected' } : entry
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cash Book</h1>
                <p className="text-sm text-gray-500">
                  {currentUser.role === 'owner' ? 'Complete financial overview' : 'Your transaction history'}
                </p>
              </div>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <FaUserCircle className="text-gray-500 text-2xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">Total Credits (Income)</p>
            <p className="text-2xl font-bold text-green-600">₹{totals.totalCredit.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-500 mb-1">Total Debits (Expenses)</p>
            <p className="text-2xl font-bold text-red-600">₹{totals.totalDebit.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{totals.balance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">As of today</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              {currentUser.role === 'owner' && (
                <>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <FaDownload className="text-gray-500" />
                    <span className="text-sm">Export</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <FaPrint className="text-gray-500" />
                    <span className="text-sm">Print</span>
                  </button>
                </>
              )}
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaPlus />
                <span>Add Entry</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <select 
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="all">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            
            <select 
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">All Categories</option>
              <option value="Sales">Sales</option>
              <option value="Office Expenses">Office Expenses</option>
              <option value="Salary">Salary</option>
              <option value="Utilities">Utilities</option>
            </select>
            
            {currentUser.role === 'owner' && (
              <select 
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Cash Book Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (₹)</th>
                  {currentUser.role === 'owner' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-xs text-gray-500">{entry.reference}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {entry.type === 'credit' ? `₹${entry.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {entry.type === 'debit' ? `₹${entry.amount.toLocaleString()}` : '-'}
                    </td>
                    {currentUser.role === 'owner' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.createdBy}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${entry.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <FaEye />
                        </button>
                        
                        {canModifyEntry(entry) && entry.status === 'pending' && (
                          <>
                            <button 
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handleApproveEntry(entry.id)}
                            >
                              <FaCheckCircle />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleRejectEntry(entry.id)}
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                        
                        {canModifyEntry(entry) && (
                          <>
                            <button className="text-indigo-600 hover:text-indigo-800">
                              <FaEdit />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <FaMoneyBillWave className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddEntryModal 
          onClose={() => setShowAddModal(false)}
          onSave={handleAddEntry}
          userRole={currentUser.role}
        />
      )}

      {/* View Entry Modal */}
      {selectedEntry && (
        <ViewEntryModal 
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          userRole={currentUser.role}
        />
      )}
    </div>
  );
};

// Add Entry Modal Component
const AddEntryModal = ({ onClose, onSave, userRole }) => {
  const [formData, setFormData] = useState({
    description: '',
    type: 'credit',
    amount: '',
    category: 'Sales',
    paymentMethod: 'Cash',
    reference: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Add New Entry</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Sales">Sales</option>
                <option value="Office Expenses">Office Expenses</option>
                <option value="Salary">Salary</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference (Optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            
            {userRole === 'employee' && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Your entry will be pending approval from the owner.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Entry Modal Component
const ViewEntryModal = ({ entry, onClose, userRole }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{entry.date}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Description</span>
              <span className="font-medium">{entry.description}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Type</span>
              <span className={`font-medium ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Amount</span>
              <span className={`font-bold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                ₹{entry.amount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Category</span>
              <span className="font-medium">{entry.category}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium">{entry.paymentMethod}</span>
            </div>
            
            {entry.reference && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium">{entry.reference}</span>
              </div>
            )}
            
            {entry.notes && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Notes</span>
                <span className="font-medium">{entry.notes}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Created By</span>
              <span className="font-medium">{entry.createdBy}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                ${entry.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                {entry.status}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBook;