'use client'
 
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          Something went <span className="text-rose-500">wrong</span>
        </h1>
        
        <p className="text-slate-500 font-medium mb-10">
          We encountered an unexpected error. Don't worry, your data is safe. Please try again or return to the dashboard.
        </p>
 
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
        </div>

        <div className="mt-10 pt-10 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Error ID: {error.digest || 'ERR_UNKNOWN'}
          </p>
        </div>
      </div>
    </div>
  )
}
