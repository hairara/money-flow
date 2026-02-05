import React from 'react';
import './Appcopy.css';

function App() {
  return (
    <div style={{ padding: 40 }} className="container">
      <h1>MoneyFlow</h1>

      <section className="card">
        <h3>Tambah Income</h3>

        <input placeholder="Nama income" />
        <input placeholder="Nominal" />

        <button>Simpan Income</button>
      </section>
    </div>
  );
}

import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    console.log('SUBMIT:', name, amount);
  };

  return (
    <>
      <input onChange={(e) => setName(e.target.value)} />
      <input onChange={(e) => setAmount(e.target.value)} />
      <button onClick={handleSubmit}>Simpan Income</button>
    </>
  );
}


export default App;
