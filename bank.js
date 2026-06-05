// ══════════════════════════════════════════════
//  KhmerBank — Prototype & Inheritance
// ══════════════════════════════════════════════


// ── PARENT: BankAccount ───────────────────────

function BankAccount(owner, number, balance) {
    this.owner   = owner;
    this.number  = number;
    this.balance = balance || 0;
    this.history = [];
}

BankAccount.prototype.deposit = function(amount) {
    if (amount <= 0) return false;
    this.balance += amount;
    this.history.push({ type: "deposit", amount });
    return true;
};

BankAccount.prototype.withdraw = function(amount) {
    if (amount > this.balance) return false;
    this.balance -= amount;
    this.history.push({ type: "withdraw", amount });
    return true;
};

BankAccount.prototype.getBalance = function() {
    return this.balance;
};


// ── CHILD: SavingsAccount ─────────────────────

function SavingsAccount(owner, number, balance, interestRate) {
    BankAccount.call(this, owner, number, balance);
    this.interestRate = interestRate;
}

SavingsAccount.prototype = Object.create(BankAccount.prototype);
SavingsAccount.prototype.constructor = SavingsAccount;

SavingsAccount.prototype.applyInterest = function() {
    const interest = +(this.balance * this.interestRate).toFixed(2);
    this.deposit(interest);
    return interest;
};


// ── CREATE ACCOUNTS ───────────────────────────

const accounts = {
    checking: new BankAccount("Vanna", "ACC-001", 1000),
    savings:  new SavingsAccount("Vanna", "ACC-002", 500, 0.03),
};

// track which statement tab is active
let activeStatement = "checking";


// ── UI Helpers ────────────────────────────────

function fmt(n) {
    return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateBalanceUI(which) {
    const el = document.getElementById("bal-" + which);
    el.textContent = fmt(accounts[which].getBalance());
    el.classList.remove("bump");
    void el.offsetWidth; // reflow to restart animation
    el.classList.add("bump");
}

function showMsg(which, text, type) {
    const el = document.getElementById("msg-" + which);
    el.textContent = text;
    el.className = "msg " + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.className = "msg"; }, 2500);
}

function renderStatement(which) {
    const acc  = accounts[which];
    const body = document.getElementById("statement-body");
    const foot = document.getElementById("statement-footer");

    if (!acc.history.length) {
        body.innerHTML = `<div class="empty-state">No transactions yet.</div>`;
        foot.innerHTML = "";
        return;
    }

    body.innerHTML = [...acc.history].reverse().map((tx, i) => {
        const sign = tx.type === "deposit" ? "+" : "-";
        const cls  = tx.type === "deposit" ? "pos" : "neg";
        return `
          <div class="tx-row">
            <span class="tx-index">${acc.history.length - i}</span>
            <span class="tx-type">${tx.type}</span>
            <span class="tx-amt ${cls}">${sign}${fmt(tx.amount)}</span>
          </div>`;
    }).join("");

    foot.innerHTML = `
      <span>${acc.owner} · ${acc.number}</span>
      <span>Balance: <strong style="color:var(--gold2)">${fmt(acc.getBalance())}</strong></span>`;
}


// ── Actions ───────────────────────────────────

function act(which, action) {
    const inp = document.getElementById("inp-" + which);
    const val = parseFloat(inp.value);

    if (!val || val <= 0) {
        showMsg(which, "⚠ Enter a valid amount", "err");
        return;
    }

    if (action === "deposit") {
        accounts[which].deposit(val);
        showMsg(which, `✅ Deposited ${fmt(val)}`, "ok");
    } else {
        const ok = accounts[which].withdraw(val);
        if (!ok) {
            showMsg(which, `❌ Insufficient funds!`, "err");
            inp.value = "";
            return;
        }
        showMsg(which, `✅ Withdrew ${fmt(val)}`, "ok");
    }

    inp.value = "";
    updateBalanceUI(which);

    // refresh statement if this account is active
    if (activeStatement === which) renderStatement(which);
}

function applyInterest() {
    const interest = accounts.savings.applyInterest();
    showMsg("savings", `📈 Interest applied: +${fmt(interest)}`, "ok");
    updateBalanceUI("savings");
    if (activeStatement === "savings") renderStatement("savings");
}

function switchStatement(which) {
    activeStatement = which;
    document.querySelectorAll(".stab").forEach((t, i) => {
        t.classList.toggle("active", ["checking", "savings"][i] === which);
    });
    renderStatement(which);
}


// ── Init ──────────────────────────────────────

updateBalanceUI("checking");
updateBalanceUI("savings");
renderStatement("checking");
