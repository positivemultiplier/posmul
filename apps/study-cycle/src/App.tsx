/**
 * PosMul StudyCycle App - React Native 진입점 (간소화 버전)
 * 
 * Auth-Economy SDK 통합으로 학습 보상 시스템을 제공하는 모바일 앱
 * 독립 앱 전환을 위한 최소 기능 구현
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthEconomy } from './shared/useAuthEconomy';

/**
 * StudyCycle 앱 메인 컴포넌트 (간소화 버전)
 * 독립 앱 분리를 위한 최소 기능만 포함
 */
export default function App(): React.JSX.Element {
  // 로그인 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Auth-Economy SDK 훅 활성화
  const {
    user,
    loading,
    pmpBalance,
    pmcBalance,
    lastEconomicUpdate,
    signIn,
    signUp,
    signOut,
    refreshEconomicData,
  } = useAuthEconomy();

  // 인증 핸들러 함수들
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const success = isLoginMode 
        ? await signIn(email, password)
        : await signUp(email, password);
      
      if (success) {
        Alert.alert('성공', isLoginMode ? '로그인되었습니다!' : '회원가입이 완료되었습니다!');
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('실패', isLoginMode ? '로그인에 실패했습니다.' : '회원가입에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 연결을 확인해주세요.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('로그아웃', '로그아웃되었습니다.');
    } catch (error) {
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshEconomicData();
      Alert.alert('성공', '데이터가 새로고침되었습니다!');
    } catch (error) {
      Alert.alert('오류', '데이터 새로고침에 실패했습니다.');
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PosMul StudyCycle</Text>
        <Text style={styles.statusText}>🔄 Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PosMul StudyCycle</Text>
      <Text style={styles.subtitle}>학습하고 PMP 토큰을 받으세요! 📚</Text>
      
      {/* 사용자 인증 상태 */}
      <View style={styles.statusContainer}>
        {user ? (
          <View>
            <Text style={styles.statusText}>
              ✅ 로그인됨: {user.email}
            </Text>
            <Text style={styles.statusText}>
              💰 PMP 잔액: {pmpBalance}
            </Text>
            <Text style={styles.statusText}>
              🪙 PMC 잔액: {pmcBalance}
            </Text>
            {lastEconomicUpdate && (
              <Text style={styles.statusText}>
                🔄 마지막 업데이트: {lastEconomicUpdate.toLocaleTimeString()}
              </Text>
            )}
            
            {/* 로그인된 사용자를 위한 버튼들 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleRefresh}>
                <Text style={styles.buttonText}>잔액 새로고침</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleSignOut}>
                <Text style={styles.buttonText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.statusText}>
              🔐 로그인이 필요합니다
            </Text>
            <Text style={styles.statusText}>
              Auth-Economy SDK 연결됨 ✅
            </Text>
            
            {/* 로그인/회원가입 폼 */}
            <View style={styles.authForm}>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>
                  {isLoginMode ? '로그인' : '회원가입'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setIsLoginMode(!isLoginMode)}
              >
                <Text style={styles.switchButtonText}>
                  {isLoginMode ? '회원가입하기' : '로그인하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          PosMul StudyCycle v0.1.0 - Phase 1 완료
        </Text>
        <Text style={styles.footerText}>
          Auth-Economy SDK 활성화됨
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginBottom: 30,
    alignItems: 'center',
    minWidth: '90%',
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
    textAlign: 'center',
  },
  authForm: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 100,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});
