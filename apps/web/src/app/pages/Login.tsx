import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/Label';
import { useAuthStore } from '../store/AuthStore';

type Tab = 'login' | 'register';

interface LoginFormValues {
  email: string;
  password: string;
}

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function Login() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormValues>({ defaultValues: { email: '', password: '' } });
  const registerForm = useForm<RegisterFormValues>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onLogin = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    try {
      await register(data.firstName, data.lastName, data.email, data.password);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Monetria
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra tus finanzas personales
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-6">
            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder=""
                    autoComplete="email"
                    {...loginForm.register('email', {
                      required: 'El correo es requerido',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Ingresa un correo válido',
                      },
                    })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder=""
                      autoComplete="current-password"
                      className="pr-10"
                      {...loginForm.register('password', {
                        required: 'La contraseña es requerida',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-first-name">Nombre(s)</Label>
                    <Input
                      id="register-first-name"
                      type="text"
                      placeholder=""
                      autoComplete="given-name"
                      {...registerForm.register('firstName', {
                        required: 'Requerido',
                        minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                      })}
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-xs text-red-500">{registerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-last-name">Apellido(s)</Label>
                    <Input
                      id="register-last-name"
                      type="text"
                      placeholder=""
                      autoComplete="family-name"
                      {...registerForm.register('lastName', {
                        required: 'Requerido',
                        minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                      })}
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-xs text-red-500">{registerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-email">Correo electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder=""
                    autoComplete="email"
                    {...registerForm.register('email', {
                      required: 'El correo es requerido',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Ingresa un correo válido',
                      },
                    })}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder=""
                      autoComplete="new-password"
                      className="pr-10"
                      {...registerForm.register('password', {
                        required: 'La contraseña es requerida',
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder=""
                      autoComplete="new-password"
                      className="pr-10"
                      {...registerForm.register('confirmPassword', {
                        required: 'Confirma tu contraseña',
                        validate: value =>
                          value === registerForm.getValues('password') || 'Las contraseñas no coinciden',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
