import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from '@emotion/styled';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginFormData } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  FormGroup,
  Label,
  Input,
  Button,
  ErrorMessage,
  Divider,
  LoadingSpinner,
} from '../../styles/shared';
import { theme } from '../../styles/theme';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
`;

const Title = styled.h1`
  text-align: center;
  color: ${theme.colors.gray[800]};
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.sm};
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${theme.colors.gray[600]};
  font-size: ${theme.fontSizes.md};
  margin-bottom: ${theme.spacing.xl};
`;

const SocialLoginSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const SocialButton = styled(Button)<{ provider: string }>`
  position: relative;
  background: ${props => {
    switch (props.provider) {
      case 'google':
        return '#ffffff';
      case 'kakao':
        return '#FEE500';
      case 'naver':
        return '#03C75A';
      default:
        return theme.colors.gray[200];
    }
  }};
  color: ${props => {
    switch (props.provider) {
      case 'google':
        return '#3c4043';
      case 'kakao':
        return '#000000';
      case 'naver':
        return '#ffffff';
      default:
        return theme.colors.gray[700];
    }
  }};
  border: ${props => props.provider === 'google' ? '1px solid #dadce0' : 'none'};

  &:hover {
    opacity: 0.9;
  }
`;

const RegisterPrompt = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.lg};
  color: ${theme.colors.gray[600]};
  font-size: ${theme.fontSizes.sm};
`;

const ForgotPasswordLink = styled.div`
  text-align: right;
  margin-top: ${theme.spacing.sm};
`;

const StyledLink = styled(RouterLink)`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.medium};
  text-decoration: none;
  transition: ${theme.transitions.fast};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const GlobalError = styled.div`
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid ${theme.colors.error};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.error};
  font-size: ${theme.fontSizes.sm};
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const schema = yup.object({
  email: yup
    .string()
    .email('올바른 이메일 형식이 아닙니다.')
    .required('이메일을 입력해주세요.'),
  password: yup
    .string()
    .required('비밀번호를 입력해주세요.'),
});

const LoginForm: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isValidating },
    trigger,
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();
    try {
      await login(data);
      // Navigate to dashboard after successful login
      // If user was redirected to login from a private route, go back to that route
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldBlur = async (fieldName: keyof LoginFormData) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    await trigger(fieldName);
  };

  const handleFieldChange = async (fieldName: keyof LoginFormData) => {
    if (touched[fieldName]) {
      await trigger(fieldName);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    // Redirect to social login endpoint
    window.location.href = `http://localhost:7070/api/v1/auth/oauth/${provider}`;
  };

  return (
    <Container>
      <Card>
        <Title>살래말래</Title>
        <Subtitle>주식 예측 게임에 참여하세요!</Subtitle>

        {authError && <GlobalError>{authError}</GlobalError>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              hasError={touched.email && !!errors.email}
              {...register('email', {
                onBlur: () => handleFieldBlur('email'),
                onChange: () => handleFieldChange('email'),
              })}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
            />
            {touched.email && errors.email && (
              <ErrorMessage id="email-error" role="alert">
                {errors.email.message}
              </ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              hasError={touched.password && !!errors.password}
              {...register('password', {
                onBlur: () => handleFieldBlur('password'),
                onChange: () => handleFieldChange('password'),
              })}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
            />
            {touched.password && errors.password && (
              <ErrorMessage id="password-error" role="alert">
                {errors.password.message}
              </ErrorMessage>
            )}
          </FormGroup>

          <ForgotPasswordLink>
            <StyledLink to="/forgot-password">
              비밀번호를 잊으셨나요?
            </StyledLink>
          </ForgotPasswordLink>

          <Button type="submit" fullWidth disabled={isLoading} style={{ marginTop: theme.spacing.lg }}>
            {isLoading ? <LoadingSpinner /> : '로그인'}
          </Button>
        </form>

        <Divider>
          <span>또는</span>
        </Divider>

        <SocialLoginSection>
          <SocialButton
            type="button"
            provider="google"
            fullWidth
            onClick={() => handleSocialLogin('google')}
          >
            Google로 시작하기
          </SocialButton>
          <SocialButton
            type="button"
            provider="kakao"
            fullWidth
            onClick={() => handleSocialLogin('kakao')}
          >
            카카오로 시작하기
          </SocialButton>
          <SocialButton
            type="button"
            provider="naver"
            fullWidth
            onClick={() => handleSocialLogin('naver')}
          >
            네이버로 시작하기
          </SocialButton>
        </SocialLoginSection>

        <RegisterPrompt>
          아직 회원이 아니신가요?{' '}
          <StyledLink to="/register">
            회원가입
          </StyledLink>
        </RegisterPrompt>
      </Card>
    </Container>
  );
};

export default LoginForm;