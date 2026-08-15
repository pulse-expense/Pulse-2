import express from 'express';
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'pulse-api',version:'16.0.0',time:new Date().toISOString()}));
app.get('/api/config',(_req,res)=>res.json({realtime:true,backend:'node'}));
const port=Number(process.env.PORT||8787);app.listen(port,()=>console.log(`Pulse API listening on ${port}`));