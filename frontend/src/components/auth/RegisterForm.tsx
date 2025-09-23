import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from '@emotion/styled';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { RegisterFormData } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';
import {
  Card,
  FormGroup,
  Label,
  Input,
  Button,
  ErrorMessage,
  SuccessMessage,
  CheckboxWrapper,
  Checkbox,
  CheckboxLabel,
  LoadingSpinner,
} from '../../styles/shared';
import { theme } from '../../styles/theme';
import { validatePassword, validateUsername } from '../../utils/auth';

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

const LoginPrompt = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.lg};
  color: ${theme.colors.gray[600]};
  font-size: ${theme.fontSizes.sm};
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

const PasswordStrength = styled.div<{ strength: number }>`
  display: flex;
  gap: 4px;
  margin-top: ${theme.spacing.xs};

  span {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: ${props => {
      if (props.strength === 0) return theme.colors.gray[300];
      if (props.strength < 3) return theme.colors.error;
      if (props.strength < 4) return theme.colors.warning;
      return theme.colors.success;
    }};
    opacity: ${props => props.strength > 0 ? 1 : 0.3};

    &:nth-of-type(2) {
      opacity: ${props => props.strength > 1 ? 1 : 0.3};
    }
    &:nth-of-type(3) {
      opacity: ${props => props.strength > 2 ? 1 : 0.3};
    }
    &:nth-of-type(4) {
      opacity: ${props => props.strength > 3 ? 1 : 0.3};
    }
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
`;

const AvailabilityIndicator = styled.span<{ available?: boolean }>`
  margin-left: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
  color: ${props => props.available ? theme.colors.success : theme.colors.error};
`;

const schema = yup.object({
  email: yup
    .string()
    .email('올바른 이메일 형식이 아닙니다.')
    .required('이메일을 입력해주세요.'),
  username: yup
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.')
    .matches(/^[a-zA-Z0-9가-힣]+$/, '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.')
    .required('닉네임을 입력해주세요.'),
  password: yup
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .required('비밀번호를 입력해주세요.'),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref('password')], '비밀번호가 일치하지 않습니다.')
    .required('비밀번호 확인을 입력해주세요.'),
  termsAccepted: yup
    .boolean()
    .oneOf([true], '이용약관에 동의해주세요.')
    .required('이용약관에 동의해주세요.'),
});

const RegisterForm: React.FC = () => {
  const { register: registerUser, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const watchPassword = watch('password');
  const watchEmail = watch('email');
  const watchUsername = watch('username');

  // Check password strength
  useEffect(() => {
    if (!watchPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (watchPassword.length >= 8) strength++;
    if (/[A-Z]/.test(watchPassword)) strength++;
    if (/[a-z]/.test(watchPassword)) strength++;
    if (/[0-9]/.test(watchPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(watchPassword)) strength++;

    setPasswordStrength(Math.min(strength, 4));
  }, [watchPassword]);

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!watchEmail || errors.email) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await authService.checkEmailAvailability(watchEmail);
        if (response.success && response.data) {
          setEmailAvailable(response.data.available);
        }
      } catch (error) {
        console.error('Email check error:', error);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [watchEmail, errors.email]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!watchUsername || errors.username) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await authService.checkUsernameAvailability(watchUsername);
        if (response.success && response.data) {
          setUsernameAvailable(response.data.available);
        }
      } catch (error) {
        console.error('Username check error:', error);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [watchUsername, errors.username]);

  const onSubmit = async (data: RegisterFormData) => {
    // Check availability before submission
    if (emailAvailable === false || usernameAvailable === false) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        termsAccepted: data.termsAccepted,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>회원가입</Title>
        <Subtitle>살래말래에 오신 것을 환영합니다!</Subtitle>

        {authError && <GlobalError>{authError}</GlobalError>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="email">
              이메일
              {checkingEmail && <AvailabilityIndicator>확인중...</AvailabilityIndicator>}
              {!checkingEmail && emailAvailable === true && (
                <AvailabilityIndicator available>사용 가능</AvailabilityIndicator>
              )}
              {!checkingEmail && emailAvailable === false && (
                <AvailabilityIndicator available={false}>사용 중</AvailabilityIndicator>
              )}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              hasError={!!errors.email || emailAvailable === false}
              {...register('email')}
            />
            {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
            {!errors.email && emailAvailable === false && (
              <ErrorMessage>이미 사용중인 이메일입니다.</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="username">
              닉네임
              {checkingUsername && <AvailabilityIndicator>확인중...</AvailabilityIndicator>}
              {!checkingUsername && usernameAvailable === true && (
                <AvailabilityIndicator available>사용 가능</AvailabilityIndicator>
              )}
              {!checkingUsername && usernameAvailable === false && (
                <AvailabilityIndicator available={false}>사용 중</AvailabilityIndicator>
              )}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="2~20자의 한글, 영문, 숫자"
              hasError={!!errors.username || usernameAvailable === false}
              {...register('username')}
            />
            {errors.username && <ErrorMessage>{errors.username.message}</ErrorMessage>}
            {!errors.username && usernameAvailable === false && (
              <ErrorMessage>이미 사용중인 닉네임입니다.</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="대소문자, 숫자, 특수문자 포함 8자 이상"
              hasError={!!errors.password}
              {...register('password')}
            />
            {watchPassword && (
              <PasswordStrength strength={passwordStrength}>
                <span />
                <span />
                <span />
                <span />
              </PasswordStrength>
            )}
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
            {!errors.password && watchPassword && validatePassword(watchPassword) && (
              <ErrorMessage>{validatePassword(watchPassword)}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              hasError={!!errors.passwordConfirm}
              {...register('passwordConfirm')}
            />
            {errors.passwordConfirm && <ErrorMessage>{errors.passwordConfirm.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <CheckboxWrapper>
              <Checkbox
                id="termsAccepted"
                type="checkbox"
                {...register('termsAccepted')}
              />
              <CheckboxLabel htmlFor="termsAccepted">
                <StyledLink to="/terms" target="_blank">
                  이용약관
                </StyledLink>
                {' 및 '}
                <StyledLink to="/privacy" target="_blank">
                  개인정보처리방침
                </StyledLink>
                에 동의합니다
              </CheckboxLabel>
            </CheckboxWrapper>
            {errors.termsAccepted && <ErrorMessage>{errors.termsAccepted.message}</ErrorMessage>}
          </FormGroup>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading || emailAvailable === false || usernameAvailable === false}
          >
            {isLoading ? <LoadingSpinner /> : '회원가입'}
          </Button>
        </form>

        <LoginPrompt>
          이미 회원이신가요?{' '}
          <StyledLink to="/login">
            로그인
          </StyledLink>
        </LoginPrompt>
      </Card>
    </Container>
  );
};

export default RegisterForm;