import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase.js';
const Ctx=createContext(null);
export function AuthProvider({children}){const [session,setSession]=useState(null);const [loading,setLoading]=useState(Boolean(supabase));useEffect(()=>{if(!supabase){setLoading(false);return;}let alive=true;supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setLoading(false)}});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>{alive=false;subscription.unsubscribe()};},[]);const value=useMemo(()=>({session,loading}),[session,loading]);return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export const useAuth=()=>useContext(Ctx);