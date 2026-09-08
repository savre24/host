'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import useQueryParams from '@/hooks/useQueryParams';

const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const queryParams = useQueryParams();
  
  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password')
  });
  
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const login = handleSubmit(async values => {
    setLoading(true);
    signIn('credentials', {
      redirect: false,
      email: values?.email,
      password: values?.password
    }).then(async res => {
      if (res?.ok) {
        const session = await getSession();
        if (session?.user?.role === 'CLIENT') {
          push(queryParams['redirectTo'] ?? '/client/dashboard');
        } else {
          push(queryParams['redirectTo'] ?? '/dashboard');
        }
      } else {
        setLoading(false);
      }
    });
  });
  return {
    loading,
    login,
    control
  };
};
export default useSignIn;