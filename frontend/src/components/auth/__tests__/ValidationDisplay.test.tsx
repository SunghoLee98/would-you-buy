import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import LoginForm from '../LoginForm';
import RegisterForm from '../RegisterForm';

// Mock auth service
jest.mock('../../../services/auth.service', () => ({
  default: {
    login: jest.fn(),
    register: jest.fn(),
    checkEmailAvailability: jest.fn().mockResolvedValue({ success: true, data: { available: true } }),
    checkUsernameAvailability: jest.fn().mockResolvedValue({ success: true, data: { available: true } }),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Validation Message Display', () => {
  describe('LoginForm', () => {
    it('이메일 필드가 비어있을 때 에러 메시지를 표시해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      // Focus and blur to trigger validation
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('이메일을 입력해주세요.');
      });
    });

    it('잘못된 이메일 형식일 때 에러 메시지를 표시해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('올바른 이메일 형식이 아닙니다.');
      });
    });

    it('비밀번호 필드가 비어있을 때 에러 메시지를 표시해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const passwordInput = screen.getByLabelText('비밀번호');

      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('비밀번호를 입력해주세요.');
      });
    });

    it('필드를 수정할 때 에러 메시지가 사라져야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      // Trigger error
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Fix the error
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    it('비밀번호 강도 요구사항을 실시간으로 표시해야 함', async () => {
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('비밀번호');

      // Type weak password
      await userEvent.type(passwordInput, 'weak');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('비밀번호가 요구사항을 충족하지 못할 때 구체적인 에러를 표시해야 함', async () => {
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('비밀번호');

      // Password without uppercase
      await userEvent.type(passwordInput, 'password123!');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('비밀번호는 대문자를 포함해야 합니다.');
      });
    });

    it('비밀번호 확인이 일치하지 않을 때 에러를 표시해야 함', async () => {
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('비밀번호');
      const confirmInput = screen.getByLabelText('비밀번호 확인');

      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Different123!');
      fireEvent.blur(confirmInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('비밀번호가 일치하지 않습니다.');
      });
    });

    it('닉네임 형식이 잘못되었을 때 에러를 표시해야 함', async () => {
      renderWithProviders(<RegisterForm />);

      const usernameInput = screen.getByLabelText(/닉네임/);

      // Username with special characters
      await userEvent.type(usernameInput, 'user@name');
      fireEvent.blur(usernameInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.');
      });
    });

    it('이용약관 동의하지 않았을 때 에러를 표시해야 함', async () => {
      renderWithProviders(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /회원가입/i });

      // Fill required fields
      await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/닉네임/), 'testuser');
      await userEvent.type(screen.getByLabelText('비밀번호'), 'Password123!');
      await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'Password123!');

      // Submit without accepting terms
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('이용약관에 동의해주세요.');
      });
    });
  });

  describe('Error Message Styling and Animation', () => {
    it('에러 메시지가 적절한 스타일과 애니메이션을 가져야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        const styles = window.getComputedStyle(errorMessage);

        // Check if error message has proper styling
        expect(styles.display).toBe('flex');
      });
    });

    it('입력 필드가 에러 상태일 때 시각적 피드백을 제공해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        // Check if input has error styling
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });

      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('Real-time Validation Feedback', () => {
    it('포커스를 잃은 후에만 유효성 검사를 시작해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText('이메일');

      // Type without blur - should not show error yet
      await userEvent.type(emailInput, 'inva');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Blur to trigger validation
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('touched 상태의 필드만 에러를 표시해야 함', async () => {
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /로그인/i });

      // Click submit without touching any fields
      fireEvent.click(submitButton);

      await waitFor(() => {
        // All fields should show errors after submit attempt
        const errors = screen.getAllByRole('alert');
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });
});