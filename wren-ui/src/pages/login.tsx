import React from "react";
import { useRouter } from "next/router";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useMutation, gql } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";

const { Title, Text, Link } = Typography;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        username
        fullName
      }
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const LoginCard = styled(Card)`
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;

  img {
    height: 50px;
    margin-bottom: 16px;
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    font-weight: 500;
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
`;

// Force this page to be rendered on the server (prevents build-time errors)
export async function getServerSideProps() {
  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const { data } = await login({
        variables: {
          email: values.email,
          password: values.password,
        },
      });

      if (data?.login) {
        // Store tokens
        authLogin(
          data.login.accessToken,
          data.login.refreshToken,
          data.login.user,
        );

        message.success("Login successful!");
        router.push("/home");
      }
    } catch (error: any) {
      message.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <img src="/wrenai_logo.png" alt="Wren AI" />
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome to Wren AI
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </Logo>

        <StyledForm
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="your.email@example.com"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item>
            <LoginButton type="primary" htmlType="submit" loading={loading}>
              Sign In
            </LoginButton>
          </Form.Item>

          <Footer>
            <Text>
              Don't have an account?{" "}
              <Link href="/register">Create account</Link>
            </Text>
            <br />
            <Link href="/forgot-password">Forgot password?</Link>
          </Footer>
        </StyledForm>
      </LoginCard>
    </LoginContainer>
  );
}
