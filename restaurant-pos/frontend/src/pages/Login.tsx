import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { login } from '../api/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, checkAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const res = await login(data);
      setToken(res.access_token);
      await checkAuth();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Noto'g'ri username yoki parol");
      } else {
        setError("Tizimda xatolik yuz berdi");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">RestoPOS</h1>
          <p className="text-gray-500">Tizimga kirish</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              {...register('username')}
              type="text"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Kassir username"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              {...register('password')}
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Parolni kiriting"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Kutib turing...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
