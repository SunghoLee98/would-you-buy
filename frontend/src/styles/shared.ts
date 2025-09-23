import styled from '@emotion/styled';
import { theme } from './theme';

export const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing['2xl']};
  width: 100%;
  max-width: 450px;
  animation: slideUp 0.5s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.gray[700]};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
`;

export const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 2px solid ${props => props.hasError ? theme.colors.error : theme.colors.gray[300]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.md};
  background: ${props => props.hasError ? 'rgba(244, 67, 54, 0.02)' : theme.colors.white};
  transition: ${theme.transitions.fast};
  outline: none;

  &:focus {
    border-color: ${props => props.hasError ? theme.colors.error : theme.colors.primary};
    box-shadow: 0 0 0 3px ${props =>
      props.hasError ? 'rgba(244, 67, 54, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
    background: ${theme.colors.white};
  }

  &:hover:not(:focus) {
    border-color: ${props => props.hasError ? theme.colors.error : theme.colors.gray[400]};
  }

  &::placeholder {
    color: ${theme.colors.gray[400]};
  }

  &:disabled {
    background: ${theme.colors.gray[100]};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost'; fullWidth?: boolean }>`
  display: ${props => props.fullWidth ? 'block' : 'inline-block'};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  background: ${props => {
    switch (props.variant) {
      case 'secondary':
        return theme.colors.white;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.gradient.primary;
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.gray[600];
      default:
        return theme.colors.white;
    }
  }};
  border: ${props => {
    switch (props.variant) {
      case 'secondary':
        return `2px solid ${theme.colors.primary}`;
      default:
        return 'none';
    }
  }};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.md};
  font-weight: ${theme.fontWeights.bold};
  transition: ${theme.transitions.base};
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.lg};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const ErrorMessage = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-top: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: rgba(244, 67, 54, 0.08);
  border-left: 3px solid ${theme.colors.error};
  border-radius: ${theme.borderRadius.sm};
  color: ${theme.colors.error};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  animation: slideIn 0.3s ease;

  &::before {
    content: '⚠️';
    font-size: ${theme.fontSizes.xs};
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

export const SuccessMessage = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-top: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: rgba(76, 175, 80, 0.08);
  border-left: 3px solid ${theme.colors.success};
  border-radius: ${theme.borderRadius.sm};
  color: ${theme.colors.success};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  animation: slideIn 0.3s ease;

  &::before {
    content: '✓';
    font-size: ${theme.fontSizes.xs};
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

export const Link = styled.a`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.medium};
  text-decoration: none;
  transition: ${theme.transitions.fast};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const Divider = styled.div`
  position: relative;
  margin: ${theme.spacing.lg} 0;
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${theme.colors.gray[300]};
    transform: translateY(-50%);
  }

  span {
    position: relative;
    padding: 0 ${theme.spacing.md};
    background: ${theme.colors.white};
    color: ${theme.colors.gray[500]};
    font-size: ${theme.fontSizes.sm};
  }
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: ${theme.colors.primary};
  cursor: pointer;
`;

export const CheckboxLabel = styled.label`
  color: ${theme.colors.gray[700]};
  font-size: ${theme.fontSizes.sm};
  cursor: pointer;
`;

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;