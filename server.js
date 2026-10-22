const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Eka Server is Running - لعبة اكة الشيريا');
});

app.post('/api/pay', (req, res) => {
  const { player, amount } = req.body;
  console.log('Payment:', player, amount);
  res.json({ success: true, message: 'تم الدفع بنجاح' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on ' + PORT);
});
