import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Mail, X, ArrowLeft, CheckCircle, Eye, EyeOff, Check } from 'lucide-react';
import authService from '../../services/authService';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const navigate = useNavigate();
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'success'
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordRequirements = useMemo(() => {
    const p = passwordData.password;
    return {
      minLength: p.length >= 8,
      hasLowercase: /[a-z]/.test(p),
      hasUppercase: /[A-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
      passwordsMatch: p && p === passwordData.confirmPassword,
    };
  }, [passwordData]);

  const isPasswordValid = useMemo(
    () => Object.values(passwordRequirements).every(Boolean),
    [passwordRequirements]
  );

  const handleClose = () => {
    setForgotEmail('');
    setForgotEmailError('');
    setStep('email');
    setResetToken('');
    setMaskedEmail('');
    setPasswordData({ password: '', confirmPassword: '' });
    onClose();
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) { setForgotEmailError('Enter a valid email address'); return; }
    setForgotLoading(true);
    try {
      const response = await authService.forgotPassword(forgotEmail);
      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setMaskedEmail(response.email || forgotEmail);
        setStep('reset');
      }
    } catch (error) {
      if (error.response?.status === 423) {
        toast.error('Account is locked. Password reset will unlock your account after successful reset.');
      } else {
        toast.error(error.response?.data?.message || 'Email not found. Please check and try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) { toast.error('Please meet all password requirements'); return; }
    setResetLoading(true);
    try {
      await authService.resetPassword(resetToken, passwordData.password);
      setStep('success');
      toast.success('Password reset successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'email' && 'Reset Password'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Password Updated'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1 – Email */}
          {step === 'email' && (
            <>
              <p className="text-gray-600 mb-6">Enter your registered email address to verify your account.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotEmailError(e.target.value && !isValidEmail(e.target.value) ? 'Enter a valid email address' : '');
                      }}
                      className="input-field pl-10"
                      placeholder="Enter your email address"
                      required
                      autoFocus
                    />
                  </div>
                  {forgotEmailError && <p className="mt-1 text-xs text-red-600">{forgotEmailError}</p>}
                </div>
                <button type="submit" disabled={forgotLoading} className="w-full btn-primary">
                  {forgotLoading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={handleClose}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </button>
              </div>
            </>
          )}

          {/* Step 2 – New Password */}
          {step === 'reset' && (
            <>
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Email verified: <span className="font-medium">{maskedEmail}</span>
                </p>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.password}
                      onChange={(e) => setPasswordData(p => ({ ...p, password: e.target.value }))}
                      className="input-field pl-10 pr-10"
                      placeholder="Enter new password"
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordData.password && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          [passwordRequirements.minLength, 'At least 8 characters'],
                          [passwordRequirements.hasLowercase, 'One lowercase letter'],
                          [passwordRequirements.hasUppercase, 'One uppercase letter'],
                          [passwordRequirements.hasNumber, 'One number'],
                          [passwordRequirements.hasSpecial, 'One special character'],
                        ].map(([met, label]) => (
                          <div key={label} className={`flex items-center space-x-1 ${met ? 'text-green-600' : 'text-gray-500'}`}>
                            {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="input-field pl-10 pr-10"
                      placeholder="Confirm new password"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && (
                    <p className={`mt-1 text-xs flex items-center space-x-1 ${passwordRequirements.passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordRequirements.passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>{passwordRequirements.passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                    </p>
                  )}
                </div>

                <button type="submit" disabled={resetLoading || !isPasswordValid}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {resetLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setStep('email')}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="h-4 w-4" /> Back to Email
                </button>
              </div>
            </>
          )}

          {/* Step 3 – Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Updated!</h3>
              <p className="text-gray-600 mb-6">Your password has been successfully changed. You are now logged in.</p>
              <button onClick={() => { handleClose(); navigate('/teams'); }} className="w-full btn-primary">
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
