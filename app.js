document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const transactionForm = document.getElementById('transaction-form');
    const txnDateInput = document.getElementById('txn-date');
    const txnTypeSelect = document.getElementById('txn-type');
    const txnModeSelect = document.getElementById('txn-mode');
    const txnAmountInput = document.getElementById('txn-amount');
    const txnDescriptionInput = document.getElementById('txn-description');
    const todayBalanceEl = document.getElementById('today-balance');
    const yesterdayBalanceEl = document.getElementById('yesterday-balance');
    const totalBalanceEl = document.getElementById('total-balance');
    const transactionsTable = document.getElementById('transactions-table').getElementsByTagName('tbody')[0];
    const exportCsvBtn = document.getElementById('export-csv');
    const savePopup = document.getElementById('save-popup');
    const popupClose = document.querySelector('.popup-close');

    // Initialize with today's date
    txnDateInput.valueAsDate = new Date();

    // Transactions data store
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Initialize the app
    function init() {
        updateBalances();
        renderTransactions();
    }

    // Add new transaction
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseFloat(txnAmountInput.value);
        const type = txnTypeSelect.value;
        const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

        const transaction = {
            id: Date.now(),
            date: txnDateInput.value,
            type: type,
            mode: txnModeSelect.value,
            amount: finalAmount,
            description: txnDescriptionInput.value.trim()
        };

        transactions.push(transaction);
        saveTransactions();
        updateBalances();
        renderTransactions();
        
        // Show save confirmation popup
        savePopup.classList.remove('hidden');
        
        // Reset form
        transactionForm.reset();
        txnDateInput.valueAsDate = new Date();
        
        // Hide popup after 2 seconds
        setTimeout(() => {
            savePopup.classList.add('hidden');
        }, 2000);
    });

    // Close popup when X is clicked
    popupClose.addEventListener('click', function() {
        savePopup.classList.add('hidden');
    });

    // Close popup when clicking outside
    savePopup.addEventListener('click', function(e) {
        if (e.target === savePopup) {
            savePopup.classList.add('hidden');
        }
    });

    // Update balance summaries
    function updateBalances() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = yesterday.toISOString().split('T')[0];
        
        document.getElementById('yesterday-date').textContent = formatDisplayDate(yesterday);

        let todayIncome = 0, todayExpense = 0;
        let yesterdayIncome = 0, yesterdayExpense = 0;
        let totalIncome = 0, totalExpense = 0;

        transactions.forEach(txn => {
            const amount = txn.amount;
            
            if (txn.date === today) {
                if (amount >= 0) todayIncome += amount;
                else todayExpense += Math.abs(amount);
            } 
            else if (txn.date === yesterdayFormatted) {
                if (amount >= 0) yesterdayIncome += amount;
                else yesterdayExpense += Math.abs(amount);
            }

            if (amount >= 0) totalIncome += amount;
            else totalExpense += Math.abs(amount);
        });

        const todayBalance = todayIncome - todayExpense;
        const yesterdayBalance = yesterdayIncome - yesterdayExpense;
        const totalBalance = totalIncome - totalExpense;

        todayBalanceEl.textContent = formatCurrency(todayBalance);
        yesterdayBalanceEl.textContent = formatCurrency(yesterdayBalance);
        totalBalanceEl.textContent = formatCurrency(totalBalance);

        document.getElementById('today-income').textContent = `+₹${todayIncome.toFixed(2)}`;
        document.getElementById('today-expense').textContent = `-₹${todayExpense.toFixed(2)}`;
        document.getElementById('yesterday-income').textContent = `+₹${yesterdayIncome.toFixed(2)}`;
        document.getElementById('yesterday-expense').textContent = `-₹${yesterdayExpense.toFixed(2)}`;
        document.getElementById('total-income').textContent = `+₹${totalIncome.toFixed(2)}`;
        document.getElementById('total-expense').textContent = `-₹${totalExpense.toFixed(2)}`;

        updateBalanceColor(todayBalanceEl, todayBalance);
        updateBalanceColor(yesterdayBalanceEl, yesterdayBalance);
        updateBalanceColor(totalBalanceEl, totalBalance);
    }

    // Render transactions table
    function renderTransactions() {
        transactionsTable.innerHTML = '';

        if (transactions.length === 0) {
            const row = transactionsTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'No transactions yet';
            cell.style.textAlign = 'center';
            return;
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(txn => {
            const row = transactionsTable.insertRow();
            
            const date = new Date(txn.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            row.insertCell().textContent = formattedDate;
            row.insertCell().textContent = txn.type.charAt(0).toUpperCase() + txn.type.slice(1);
            row.insertCell().textContent = txn.mode.charAt(0).toUpperCase() + txn.mode.slice(1);
            
            const amountCell = row.insertCell();
            amountCell.textContent = formatCurrency(txn.amount);
            amountCell.className = txn.amount >= 0 ? 'income' : 'expense';
            
            row.insertCell().textContent = txn.description || '--';
        });
    }

    // Export to CSV
    exportCsvBtn.addEventListener('click', function() {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        let csv = 'Date,Type,Category,Amount,Description\n';

        transactions.forEach(txn => {
            csv += `"${txn.date}",${txn.type},${txn.mode},${txn.amount},"${txn.description || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Helper functions
    function formatCurrency(amount) {
        const sign = amount >= 0 ? '+' : '-';
        return `${sign}₹${Math.abs(amount).toFixed(2)}`;
    }

    function formatDisplayDate(date) {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    }

    function updateBalanceColor(element, balance) {
        if (balance > 0) {
            element.style.color = 'var(--success-color)';
        } else if (balance < 0) {
            element.style.color = 'var(--expense-color)';
        } else {
            element.style.color = 'var(--gray-color)';
        }
    }

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Initialize the app
    init();
});