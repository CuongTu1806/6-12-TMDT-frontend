import { useState } from 'react'
import { login, register } from '../services/authApi'

function InputField({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function isStrongPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)
}

export function AuthPage({ onAuthenticated, onBack, onGoHome }) {
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ loginKey: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
  })

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (event) => {
    const { name, value } = event.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    if (!loginForm.loginKey || !loginForm.password) {
      setError('Vui long nhap day du thong tin dang nhap')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await login(loginForm)
      onAuthenticated?.(response)
      onGoHome?.()
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()

    if (registerForm.username.length < 4) {
      setError('Username phải từ 4 ký tự')
      return
    }

    if (!isStrongPassword(registerForm.password)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt')
      return
    }

    if (!registerForm.email.includes('@')) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await register(registerForm)
      setAuthMode('login')
      setLoginForm((prev) => ({ ...prev, loginKey: registerForm.username }))
      setRegisterForm({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: '',
      })
      setError(typeof response === 'string' ? response : response?.message || 'Dang ky thanh cong, moi dang nhap')
    } catch (registerError) {
      setError(registerError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f2f4f8] font-sans text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button type="button" onClick={onBack || onGoHome} className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-blue-600">
            <span className="inline-block rounded-md bg-blue-100 px-2 py-1">M</span>
            Marketplace Pro
          </button>
          <button type="button" onClick={onBack || onGoHome} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold">
            Quay lai
          </button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-57px)] max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Tai khoan cua ban
          </p>
          <h1 className="mt-4 font-['Be_Vietnam_Pro',_sans-serif] text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            Dang nhap de tiep tuc
            <span className="block text-blue-600">vao Marketplace Pro</span>
          </h1>
          <p className="mt-4 max-w-md text-slate-600">
            Trang nay gom tat ca chuc nang dang nhap va dang ky, khong can modal trong App nua.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`rounded-full px-5 py-3 text-sm font-bold ${authMode === 'login' ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
              Dang nhap
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`rounded-full px-5 py-3 text-sm font-bold ${authMode === 'register' ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
              Dang ky
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">
              {authMode === 'login' ? 'Dang nhap' : 'Dang ky'}
            </h2>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`rounded-md px-3 py-1.5 font-semibold ${authMode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                Dang nhap
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`rounded-md px-3 py-1.5 font-semibold ${authMode === 'register' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                Dang ky
              </button>
            </div>
          </div>

          {error ? (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error.includes('thanh cong') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {error}
            </div>
          ) : null}

          {authMode === 'login' ? (
            <form className="mt-5 space-y-3" onSubmit={handleLogin}>
              <InputField
                label="Tai khoan"
                name="loginKey"
                value={loginForm.loginKey}
                onChange={handleLoginChange}
                placeholder="username, email hoac sdt"
              />
              <InputField
                label="Mat khau"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="nhap mat khau"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Dang xu ly...' : 'Dang nhap'}
              </button>
            </form>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={handleRegister}>
              <InputField
                label="Username"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                placeholder="tu 4 den 20 ky tu"
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="abc@gmail.com"
              />
              <InputField
                label="Ho va ten"
                name="fullName"
                value={registerForm.fullName}
                onChange={handleRegisterChange}
                placeholder="Nguyen Van A"
              />
              <InputField
                label="So dien thoai"
                name="phone"
                value={registerForm.phone}
                onChange={handleRegisterChange}
                placeholder="10-11 so"
              />
              <InputField
                label="Mat khau"
                name="password"
                type="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                placeholder="toi thieu 8 ky tu, co chu, so va ky tu dac biet"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Dang xu ly...' : 'Tao tai khoan'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}