'use client'
 
import { AlertCircle, RotateCcw } from 'lucide-react'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-slate-50 min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
            Critical System <span className="text-rose-500">Error</span>
          </h1>
          
          <p className="text-slate-500 font-medium mb-12 text-lg">
            A critical error occurred at the root of the application. Please reload the page to continue.
          </p>
   
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-4 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
            Reload Application
          </button>

          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              Error Reference: {error.digest || 'ERR_CRITICAL'}
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
