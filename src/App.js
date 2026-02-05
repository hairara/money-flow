import React, { useState, useEffect } from "react";
import "./Appcopy.css";
import { addIncome, getIncome } from "./database";


function App() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [incomes, setIncomes] = useState([]);

  const loadIncome = async () => {
    const data = await getIncome();
    setIncomes(data);
  };

  useEffect(() => {
    loadIncome();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !amount) return;

    await addIncome({
      name,
      amount: Number(amount),
      createdAt: new Date(),
    });

    setName("");
    setAmount("");

    loadIncome(); // 🔥 PENTING
  };


<div className="app-container">
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nama income"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Nominal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button type="submit">Simpan Income</button>
      </form>

      <hr />

      <h3>Daftar Income</h3>
      <ul>
        {incomes.map((item) => (
          <li key={item.id}>
            {item.name} — Rp {item.amount.toLocaleString("id-ID")}
          </li>
        ))}
      </ul>
    </div>
  );
</div>
  
}

export default App;
