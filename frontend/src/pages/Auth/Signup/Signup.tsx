'use client';

import { SignupForm } from '@/components/Forms/Authentication/SignupForm';

const Signup = () => {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to sign up
        </p>
      </div>

      <div className="grid gap-5">
        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;
