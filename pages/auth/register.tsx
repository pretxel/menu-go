/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { Row, Col, Form, Input, Button, Typography } from 'antd'

const { Text } = Typography

export default function SignUp() {
  return (
    <Row gutter={[32, 0]} className="hp-authentication-page">
      <Col
        lg={12}
        span={24}
        className="hp-bg-color-primary-4 hp-bg-color-dark-90 hp-position-relative"
      >
        <Row className="hp-image-row hp-h-100 hp-px-sm-8 hp-px-md-16 hp-pb-sm-32 hp-pt-md-96 hp-pt-md-32">
          <Col span={24}>
            <Row align="middle" justify="center" className="hp-h-100">
              <Col
                md={20}
                span={24}
                className="hp-bg-item hp-text-center hp-mb-md-32"
              >
                <img
                  src="https://cdn-1.motorsport.com/images/mgl/YMdnmR32/s1200/max-verstappen-red-bull-racing-1.webp"
                  alt="Background Image"
                />
              </Col>

              <Col xl={18} span={24} className="hp-text-item hp-text-center">
                <h2 className="hp-text-color-primary-1 hp-text-color-dark-0 hp-mx-lg-16 hp-mb-16">
                  Very good works are waiting for you 🤞
                </h2>

                <p className="hp-mb-0 hp-text-color-black-80 hp-text-color-dark-30">
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry. Lorem Ipsum has been the industr
                  standard dummy text ever.
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>

      <Col md={12}>
        <Row className="hp-h-100" align="middle" justify="center">
          <Col
            xxl={11}
            xl={15}
            lg={20}
            md={20}
            sm={24}
            className="hp-px-sm-8 hp-pt-24 hp-pb-48"
          >
            <h1>Create Account</h1>
            <p className="hp-mt-8 hp-text-color-black-60">
              Please sign up to your personal account if you want to use all our
              premium products.
            </p>

            <Form
              layout="vertical"
              name="basic"
              className="hp-mt-sm-16 hp-mt-32"
            >
              <Form.Item label="Username :">
                <Input id="error" />
              </Form.Item>

              <Form.Item label="E-mail :">
                <Input id="validating" />
              </Form.Item>

              <Form.Item label="Password :">
                <Input.Password id="password" />
              </Form.Item>

              <Form.Item label="Confirm Password :">
                <Input.Password id="confirm-password" />
              </Form.Item>

              <Form.Item className="hp-mt-16 hp-mb-8">
                <Button block type="primary" htmlType="submit">
                  Sign up
                </Button>
              </Form.Item>
            </Form>

            <div className="hp-form-info">
              <span className="hp-text-color-black-80 hp-text-color-dark-40 hp-caption hp-mr-4">
                Already have an account?
              </span>

              <Link href="/auth/login" passHref>
                <Text className="hp-text-color-primary-1 hp-text-color-dark-primary-2 hp-caption">
                  Login
                </Text>
              </Link>
            </div>

            <div className="hp-other-links hp-mt-24">
              <a
                href="#"
                className="hp-text-color-black-80 hp-text-color-dark-40"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hp-text-color-black-80 hp-text-color-dark-40"
              >
                Term of use
              </a>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  )
}
