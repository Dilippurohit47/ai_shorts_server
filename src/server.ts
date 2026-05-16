import app from "./app";

const PORT = process.env.PORT || 8000;

const server  = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



server.on('error', (err: any) => { 
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    process.exit(1);
  }
  console.error('Server error:', err);
}); 