import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface ExpenseRecord {
  id: string;
  date: string;       // YYYY-MM-DD
  category: '飲食' | '交通' | '購物';
  type: '自費' | '公家' | '送贈';
  person: string;     // Name or ID
  amount: number;
  currency: string;
  description: string;
  recipient?: string; // for '送贈'
}

interface Person {
  id: string;
  name: string;
  emoji: string;
}

// --- Constants ---
const EXPENSES_KEY = 'japan_trip_expenses_standalone';
const PERSONS_KEY = 'japan_trip_persons_standalone';

const initialPersons: Person[] = [
  { id: 'p1', name: 'Claudia', emoji: '👩' },
  { id: 'p2', name: 'Zachary', emoji: '👨' },
];

// --- ExpenseTracker Component (The original one, slightly adapted if needed) ---
const ExpenseTracker: React.FC<{
  expenses: ExpenseRecord[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  exchangeRate: number;
  calculateSummary: () => any;
  convertToHKD: (amount: number, currency: string) => number;
  persons: Person[];
  onAddPerson: () => void;
  onDeletePerson: (id: string) => void;
  newPersonName: string;
  setNewPersonName: (name: string) => void;
  newPersonEmoji: string;
  setNewPersonEmoji: (emoji: string) => void;
}> = ({ 
  expenses, 
  onAddExpense, 
  onDeleteExpense, 
  exchangeRate, 
  calculateSummary, 
  convertToHKD,
  persons,
  onAddPerson,
  onDeletePerson,
  newPersonName,
  setNewPersonName,
  newPersonEmoji,
  setNewPersonEmoji,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '飲食' as '飲食' | '交通' | '購物',
    type: '自費' as '自費' | '公家' | '送贈',
    person: persons.length > 0 ? persons[0].name : '',
    amount: 0,
    currency: 'JPY',
    description: '',
    recipient: '',
  });
  
  const [sharedExpenseEmoji, setSharedExpenseEmoji] = useState(
    localStorage.getItem('sharedExpenseEmoji') || '💑'
  );
  const [enableGiftExpense, setEnableGiftExpense] = useState(true);

  useEffect(() => {
    localStorage.setItem('sharedExpenseEmoji', sharedExpenseEmoji);
  }, [sharedExpenseEmoji]);

  const handleSubmit = () => {
    if (formData.amount <= 0) return;
    const cleanedData = {
      date: formData.date || new Date().toISOString().split('T')[0],
      category: formData.category || '飲食',
      type: formData.type || '自費',
      person: formData.person || '',
      amount: formData.amount || 0,
      currency: formData.currency || 'JPY',
      description: formData.description || '',
      recipient: formData.recipient || '',
    };
    onAddExpense(cleanedData);
    setFormData({
      ...formData,
      amount: 0,
      description: '',
      recipient: '',
    });
  };

  const summary = calculateSummary();
  const safeExpensesList = Array.isArray(expenses) ? expenses : [];

  const groupedExpenses = safeExpensesList
    .filter(exp => exp && exp.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((groups, exp) => {
      const date = exp.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(exp);
      return groups;
    }, {} as Record<string, ExpenseRecord[]>);

  const calculateDayTotal = (dayExpenses: ExpenseRecord[]) => {
    if (!Array.isArray(dayExpenses)) return 0;
    return dayExpenses.reduce((sum, exp) => sum + convertToHKD(exp?.amount || 0, exp?.currency || 'HKD'), 0);
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2C3E50', marginBottom: '32px' }}>💰 旅遊記帳助手</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {persons.map((person, idx) => {
          const personalAmount = safeExpensesList
            .filter(exp => exp && exp.type === '自費' && exp.person === person.name)
            .reduce((sum, exp) => sum + convertToHKD(exp?.amount || 0, exp?.currency || 'HKD'), 0);
          const colors = [
            'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
            'linear-gradient(135deg, #457B9D 0%, #1D3557 100%)',
            'linear-gradient(135deg, #8E7CC3 0%, #6A5A9B 100%)',
            'linear-gradient(135deg, #F4A460 0%, #D2691E 100%)',
          ];
          return (
            <div key={person.id} style={{ background: colors[idx % colors.length], padding: '20px', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>{person.emoji} {person.name} 自費</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>HK$ {personalAmount.toFixed(0)}</div>
            </div>
          );
        })}
        <div style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)', padding: '20px', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>{sharedExpenseEmoji} 公家支出</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>HK$ {summary.shared.toFixed(0)}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>每人: HK$ {(summary.shared / Math.max(1, persons.length)).toFixed(0)}</div>
        </div>
        {enableGiftExpense && (
          <div style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', padding: '20px', borderRadius: '12px', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>🎁 送贈支出</div>
            {persons.map(person => {
              const giftAmount = safeExpensesList
                .filter(exp => exp && exp.type === '送贈' && exp.recipient === person.name)
                .reduce((sum, exp) => sum + convertToHKD(exp?.amount || 0, exp?.currency || 'HKD'), 0);
              return (
                <div key={person.id} style={{ fontSize: '14px', marginTop: '4px' }}>
                  給 {person.name}: HK$ {giftAmount.toFixed(0)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Person Management */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>人物管理</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select
            value={newPersonEmoji}
            onChange={(e) => setNewPersonEmoji(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '100px' }}
          >
            <option value="👤">👤</option>
            <option value="👦">👦</option>
            <option value="👧">👧</option>
            <option value="👨">👨</option>
            <option value="👩">👩</option>
            <option value="👴">👴</option>
            <option value="👵">👵</option>
            <option value="👶">👶</option>
            <option value="👱">👱</option>
            <option value="💂">💂</option>
            <option value="👷">👷</option>
            <option value="👮">👮</option>
            <option value="🕵️">🕵️</option>
            <option value="🧑">🧑</option>
            <option value="👰">👰</option>
            <option value="🤵">🤵</option>
          </select>
          <input
            type="text"
            placeholder="人物名稱"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', flex: 1, minWidth: '200px' }}
          />
          <button
            onClick={onAddPerson}
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            ➕ 新增人物
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {persons.map((person) => (
            <div
              key={person.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#f0f0f0',
                borderRadius: '20px',
              }}
            >
              <span>{person.emoji} {person.name}</span>
              <button
                onClick={() => onDeletePerson(person.id)}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="刪除人物"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Form */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#2C3E50' }}>新增支出</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={enableGiftExpense}
              onChange={(e) => setEnableGiftExpense(e.target.checked)}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span>啟用送贈支出</span>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="飲食">🍽️ 飲食</option>
            <option value="交通">🚗 交通</option>
            <option value="購物">🛍️ 購物</option>
          </select>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="自費">💳 自費</option>
            <option value="公家">{sharedExpenseEmoji} 公家</option>
            {enableGiftExpense && <option value="送贈">🎁 送贈</option>}
          </select>
          {formData.type === '公家' && (
            <select
              value={sharedExpenseEmoji}
              onChange={(e) => setSharedExpenseEmoji(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="💑">💑 情侶</option>
              <option value="👨‍👩‍👧‍👦">👨‍👩‍👧‍👦 家庭</option>
              <option value="🏠">🏠 家用</option>
              <option value="👥">👥 共享</option>
              <option value="🤝">🤝 合夥</option>
              <option value="🏢">🏢 公司</option>
              <option value="💼">💼 商務</option>
            </select>
          )}
          {formData.type !== '公家' && (
            <select
              value={formData.person}
              onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              {persons.map(person => (
                <option key={person.id} value={person.name}>{person.emoji} {person.name}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            placeholder="金額"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="JPY">JPY (¥)</option>
            <option value="HKD">HKD ($)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="TWD">TWD (NT$)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="KRW">KRW (₩)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="MYR">MYR (RM)</option>
            <option value="THB">THB (฿)</option>
          </select>
          {formData.type === '送贈' && enableGiftExpense && (
            <select
              value={formData.recipient || ''}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">選擇收禮者</option>
              {persons.map(person => (
                <option key={person.id} value={person.name}>{person.emoji} {person.name}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', gridColumn: 'span 2' }}
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            width: '100%',
          }}
        >
          ➕ 新增支出
        </button>
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#7F8C8D' }}>
          匯率: 1 JPY = {exchangeRate.toFixed(4)} HKD
        </div>
      </div>

      {/* Expense List - Excel Style */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <h3 style={{ margin: 0, padding: '20px 24px', color: '#2C3E50', borderBottom: '2px solid #f0f0f0' }}>支出記錄</h3>
        
        {(!expenses || expenses.length === 0) ? (
          <p style={{ textAlign: 'center', color: '#7F8C8D', padding: '32px 0' }}>暫無記錄</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
              <div key={date} style={{ marginBottom: '24px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>📅 {date}</span>
                  <span>小計: HK$ {calculateDayTotal(dayExpenses).toFixed(0)}</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 50px',
                  gap: '1px',
                  background: '#e0e0e0',
                  borderBottom: '2px solid #D4AF37',
                }}>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50' }}>類別</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50' }}>類型</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50' }}>付款人</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50' }}>收禮人</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50' }}>描述</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50', textAlign: 'right' }}>原幣</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#D4AF37', textAlign: 'right' }}>HKD</div>
                  <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#2C3E50', textAlign: 'center' }}></div>
                </div>

                {dayExpenses.map((exp, idx) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 50px',
                      gap: '1px',
                      background: '#e0e0e0',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#e0e0e0'}
                  >
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#2C3E50' }}>
                      {exp.category === '飲食' ? '🍽️' : exp.category === '交通' ? '🚗' : '🛍️'} {exp.category}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#2C3E50' }}>
                      {exp.type === '自費' ? '💳' : exp.type === '公家' ? '💑' : '🎁'} {exp.type}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#2C3E50' }}>
                      {persons.find(p => p.name === exp.person)?.emoji || '👤'} {exp.person}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#7F8C8D' }}>
                      {exp.recipient ? ((persons.find(p => p.name === exp.recipient)?.emoji || '👤') + ' ' + exp.recipient) : '-'}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#2C3E50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || '-'}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#2C3E50', textAlign: 'right', fontWeight: '500' }}>
                      {exp.currency} {exp.amount.toLocaleString()}
                    </div>
                    <div style={{ background: 'white', padding: '12px', fontSize: '13px', color: '#D4AF37', textAlign: 'right', fontWeight: '600' }}>
                      HK$ {convertToHKD(exp.amount, exp.currency).toFixed(0)}
                    </div>
                    <div style={{ background: 'white', padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [exchangeRate, setExchangeRate] = useState(0.052);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmoji, setNewPersonEmoji] = useState('👤');

  // Load data on mount
  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem(EXPENSES_KEY);
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
      
      const savedPersons = localStorage.getItem(PERSONS_KEY);
      if (savedPersons) {
        setPersons(JSON.parse(savedPersons));
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
  }, [persons]);

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `e${Date.now()}`,
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const onAddPerson = () => {
    if (!newPersonName.trim()) return;
    const newPerson: Person = {
      id: `p${Date.now()}`,
      name: newPersonName.trim(),
      emoji: newPersonEmoji,
    };
    setPersons([...persons, newPerson]);
    setNewPersonName('');
    setNewPersonEmoji('👤');
  };

  const onDeletePerson = (id: string) => {
    if (confirm('確定要刪除此人物嗎？')) {
      setPersons(persons.filter(p => p.id !== id));
    }
  };

  const convertToHKD = (amount: number, currency: string): number => {
    if (currency === 'HKD') return amount;
    if (currency === 'JPY') return amount * exchangeRate;
    
    // Hardcoded rates backup
    const rates: { [key: string]: number } = {
      USD: 7.8, EUR: 8.5, GBP: 10.0, TWD: 0.25,
      CNY: 1.1, KRW: 0.006, SGD: 5.8, MYR: 1.75, THB: 0.22,
    };
    
    return amount * (rates[currency] || 1);
  };

  const calculateSummary = () => {
    const summary: any = { shared: 0 };
    if (!expenses || !Array.isArray(expenses)) return summary;

    expenses.forEach(exp => {
      if (!exp) return;
      const amountHKD = convertToHKD(exp.amount || 0, exp.currency || 'HKD');
      if (exp.type === '自費') {
        const key = `${exp.person}Personal`;
        summary[key] = (summary[key] || 0) + amountHKD;
      } else if (exp.type === '公家') {
        summary.shared += amountHKD;
      } else if (exp.type === '送贈' && exp.recipient) {
        const key = `giftTo${exp.recipient}`;
        summary[key] = (summary[key] || 0) + amountHKD;
      }
    });

    return summary;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
     <div style={{ padding: '10px', textAlign: 'center', background: '#333', color: '#fff' }}>
        <label>
           匯率設定 (JPY to HKD): 
           <input 
             type="number" 
             step="0.0001" 
             value={exchangeRate} 
             onChange={e => setExchangeRate(parseFloat(e.target.value))}
             style={{ marginLeft: '10px', padding: '4px' }}
           />
        </label>
     </div>
      <ExpenseTracker
        expenses={expenses}
        onAddExpense={addExpense}
        onDeleteExpense={deleteExpense}
        exchangeRate={exchangeRate}
        calculateSummary={calculateSummary}
        convertToHKD={convertToHKD}
        persons={persons}
        onAddPerson={onAddPerson}
        onDeletePerson={onDeletePerson}
        newPersonName={newPersonName}
        setNewPersonName={setNewPersonName}
        newPersonEmoji={newPersonEmoji}
        setNewPersonEmoji={setNewPersonEmoji}
      />
    </div>
  );
}

export default App;
