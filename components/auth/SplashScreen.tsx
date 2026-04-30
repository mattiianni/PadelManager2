
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { APP_VERSION } from '../../constants.ts';
import { MaterialIcon } from '../ui/Icons.tsx';

const SplashScreen: React.FC = () => {
    const { login } = useAuth();
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);
        setError(null);

        // Auto-advance to next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (digit && index === 5) {
            const code = newDigits.join('');
            if (code.length === 6) {
                handleSubmit(code);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setDigits(newDigits);
        }
        if (e.key === 'Enter') {
            const code = digits.join('');
            if (code.length === 6) {
                handleSubmit(code);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newDigits = pasted.split('');
            setDigits(newDigits);
            inputRefs.current[5]?.focus();
            handleSubmit(pasted);
        }
    };

    const handleSubmit = async (code: string) => {
        setIsLoading(true);
        setError(null);

        const result = await login(code);

        if (!result.success) {
            setError(result.error || 'Codice non valido');
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        }
        setIsLoading(false);
    };

    const code = digits.join('');
    const isComplete = code.length === 6;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1326] p-4 text-[#dae2fd]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-8%] h-[46vw] w-[46vw] rounded-full bg-sky-400/12 blur-[120px]" />
                <div className="absolute bottom-[-18%] right-[-8%] h-[38vw] w-[38vw] rounded-full bg-lime-400/8 blur-[120px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(137,206,255,0.08),transparent_28%),linear-gradient(180deg,#0b1326_0%,#060e20_100%)]" />
            </div>
            <div className="relative z-10 w-full max-w-[440px]">
                <div className="fade-in rounded-[28px] border border-white/10 bg-white/6 p-8 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-[28px]">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_24px_rgba(137,206,255,0.15)]">
                            <MaterialIcon name="sports_tennis" filled className="text-[32px] text-sky-300" />
                        </div>
                        <h1 className="text-[32px] font-bold tracking-tight text-white">
                            Padel Elo Manager
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            IL TUO GESTORE DI PADEL
                        </p>
                    </div>

                    <div className="mb-3 text-center text-sm font-semibold text-slate-200">
                        Inserisci il codice di accesso
                    </div>

                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(index, e.target.value)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                disabled={isLoading}
                                style={{ WebkitTextSecurity: 'disc', textSecurity: 'disc' } as React.CSSProperties}
                                className={`h-14 w-12 rounded-xl border text-center text-xl font-extrabold tracking-[0.08em]
                                    ${error
                                        ? 'border-red-400'
                                        : 'border-white/10 focus:border-sky-400'
                                    }
                                    bg-white/6 text-app dark:text-sky-200 shadow-inner outline-none transition-all duration-200
                                    placeholder:text-slate-500 ${isLoading ? 'opacity-50' : ''}
                                `}
                                aria-label={`Cifra ${index + 1}`}
                                placeholder=""
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-medium text-red-300">
                                {error}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => isComplete && handleSubmit(code)}
                        disabled={!isComplete || isLoading}
                        className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl px-4 font-bold transition-all duration-200
                            ${isComplete && !isLoading
                                ? 'bg-sky-300 text-[#00344d] shadow-[0_0_20px_rgba(137,206,255,0.35)] hover:bg-sky-200'
                                : 'cursor-not-allowed bg-white/10 text-slate-500'
                            }
                        `}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Verifica in corso...
                            </span>
                        ) : (
                            <>
                                <span>Accedi</span>
                                <MaterialIcon name="arrow_forward" className="text-[20px]" />
                            </>
                        )}
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-white/50">
                    Padel ELO Manager v{APP_VERSION}
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
