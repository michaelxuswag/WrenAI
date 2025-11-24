import React from "react";
import { useRouter } from "next/router";
import { Form, Input, Button, Card, message, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useMutation, gql } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";

const { Title, Text, Link } = Typography;

const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $username: String!
    $password: String!
    $fullName: String
    $organizationName: String
  ) {
    register(
      email: $email
      username: $username
      password: $password
      fullName: $fullName
      organizationName: $organizationName
    ) {
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

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const RegisterCard = styled(Card)`
  width: 500px;
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

const RegisterButton = styled(Button)`
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

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [register, { loading }] = useMutation(REGISTER_MUTATION);

  const onFinish = async (values: any) => {
    try {
      const { data } = await register({
        variables: {
          email: values.email,
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          organizationName: values.organizationName,
        },
      });

      if (data?.register) {
        // Store tokens
        login(
          data.register.accessToken,
          data.register.refreshToken,
          data.register.user,
        );

        message.success("Registration successful! Welcome to Wren AI!");
        router.push("/home");
      }
    } catch (error: any) {
      message.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <Logo>
          <img src="/wrenai_logo.png" alt="Wren AI" />
          <Title level={2} style={{ marginBottom: 8 }}>
            Create Your Account
          </Title>
          <Text type="secondary">Start your GenBI journey</Text>
        </Logo>

        <StyledForm
          name="register"
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
              prefix={<MailOutlined />}
              placeholder="your.email@example.com"
            />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Please input your username!" },
              { min: 3, message: "Username must be at least 3 characters!" },
              {
                pattern: /^[a-zA-Z0-9_-]+$/,
                message: "Username can only contain letters, numbers, _ and -",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="johndoe" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: false }]}
          >
            <Input prefix={<UserOutlined />} placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            label="Organization Name"
            name="organizationName"
            rules={[{ required: false }]}
            extra="Your personal workspace (can be changed later)"
          >
            <Input prefix={<TeamOutlined />} placeholder="Acme Corp" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 8, message: "Password must be at least 8 characters!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a strong password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
            />
          </Form.Item>

          <Form.Item>
            <RegisterButton type="primary" htmlType="submit" loading={loading}>
              Create Account
            </RegisterButton>
          </Form.Item>

          <Footer>
            <Text>
              Already have an account? <Link href="/login">Sign in</Link>
            </Text>
          </Footer>
        </StyledForm>
      </RegisterCard>
    </RegisterContainer>
  );
}
