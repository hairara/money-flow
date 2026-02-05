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

export default App;
