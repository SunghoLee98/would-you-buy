import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types/auth.types';
import authService from '../services/auth.service';
import { Card, Button, LoadingSpinner } from '../styles/shared';
import { theme } from '../styles/theme';

const Container = styled.div`
  min-height: 100vh;
  padding: ${theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing['2xl']};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
`;

const Logo = styled.h1`
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
`;

const ProfileCard = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray[200]};
`;

const UserInfo = styled.div`
  h2 {
    color: ${theme.colors.gray[800]};
    font-size: ${theme.fontSizes['2xl']};
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.gray[600]};
    font-size: ${theme.fontSizes.md};
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  background: ${theme.colors.gradient.primary};
  color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray[50]};
  border-radius: ${theme.borderRadius.lg};
  transition: ${theme.transitions.base};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }

  h3 {
    color: ${theme.colors.gray[600]};
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.medium};
    text-transform: uppercase;
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.gray[800]};
    font-size: ${theme.fontSizes['2xl']};
    font-weight: ${theme.fontWeights.bold};

    &.highlight {
      background: ${theme.colors.gradient.primary};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  small {
    color: ${theme.colors.gray[500]};
    font-size: ${theme.fontSizes.xs};
  }
`;

const InfoSection = styled.div`
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.xl};
  border-top: 1px solid ${theme.colors.gray[200]};

  h3 {
    color: ${theme.colors.gray[700]};
    font-size: ${theme.fontSizes.lg};
    font-weight: ${theme.fontWeights.medium};
    margin-bottom: ${theme.spacing.md};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing.md};
  background: ${theme.colors.gray[50]};
  border-radius: ${theme.borderRadius.md};

  span:first-of-type {
    color: ${theme.colors.gray[600]};
    font-size: ${theme.fontSizes.sm};
  }

  span:last-of-type {
    color: ${theme.colors.gray[800]};
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.medium};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.gray[500]};

  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing.md};
  }

  p {
    font-size: ${theme.fontSizes.md};
    margin-bottom: ${theme.spacing.xl};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing['3xl']};
`;

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError('프로필을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('프로필을 불러오는 중 오류가 발생했습니다.');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAccuracy = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <Button onClick={() => fetchUserProfile()}>다시 시도</Button>
        </EmptyState>
      </Container>
    );
  }

  if (!profile || !user) {
    return (
      <Container>
        <EmptyState>
          <h3>프로필 정보가 없습니다</h3>
          <p>로그인이 필요합니다.</p>
          <Button onClick={() => navigate('/login')}>로그인하기</Button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>살래말래</Logo>
        <Button variant="secondary" onClick={handleLogout}>
          로그아웃
        </Button>
      </Header>

      <ProfileCard>
        <ProfileHeader>
          <UserInfo>
            <h2>{profile.username}님 환영합니다!</h2>
            <p>{profile.email}</p>
          </UserInfo>
          <Badge>{profile.role === 'ADMIN' ? '관리자' : '일반 회원'}</Badge>
        </ProfileHeader>

        <StatsGrid>
          <StatCard>
            <h3>예측 정확도</h3>
            <p className="highlight">
              {profile.statistics.accuracyRate
                ? formatAccuracy(profile.statistics.accuracyRate)
                : '0%'}
            </p>
            <small>
              {profile.statistics.correctPredictions} / {profile.statistics.totalPredictions}
            </small>
          </StatCard>

          <StatCard>
            <h3>총 포인트</h3>
            <p className="highlight">{profile.statistics.totalPoints.toLocaleString()}</p>
            <small>점</small>
          </StatCard>

          <StatCard>
            <h3>현재 연속</h3>
            <p>{profile.statistics.currentStreak}</p>
            <small>일</small>
          </StatCard>

          <StatCard>
            <h3>최장 연속</h3>
            <p>{profile.statistics.longestStreak}</p>
            <small>일</small>
          </StatCard>
        </StatsGrid>

        {profile.statistics.totalPredictions === 0 && (
          <EmptyState>
            <h3>아직 예측을 시작하지 않으셨네요!</h3>
            <p>오늘의 주식 시장을 예측하고 포인트를 획득해보세요.</p>
            <Button onClick={() => navigate('/predict')}>예측 시작하기</Button>
          </EmptyState>
        )}

        <InfoSection>
          <h3>계정 정보</h3>
          <InfoGrid>
            <InfoItem>
              <span>가입일</span>
              <span>{formatDate(profile.createdAt)}</span>
            </InfoItem>
            <InfoItem>
              <span>마지막 접속</span>
              <span>{formatDate(profile.lastLoginAt)}</span>
            </InfoItem>
            <InfoItem>
              <span>총 예측 횟수</span>
              <span>{profile.statistics.totalPredictions}회</span>
            </InfoItem>
            <InfoItem>
              <span>정답 예측</span>
              <span>{profile.statistics.correctPredictions}회</span>
            </InfoItem>
          </InfoGrid>
        </InfoSection>
      </ProfileCard>
    </Container>
  );
};

export default Dashboard;