/* eslint-disable @next/next/no-img-element */
import { Col, Row } from 'antd'
import geekWire from '../../src/assets/images/pages/landing/geekWire.png'
import slack from '../../src/assets/images/pages/landing/slack.png'
import envato from '../../src/assets/images/pages/landing/envato.png'
import usaToday from '../../src/assets/images/pages/landing/usaToday.png'
import forbes from '../../src/assets/images/pages/landing/forbes.png'

export default function LandingCompanies() {
  return (
    <section className="hp-landing-companies hp-overflow-hidden hp-pt-64 hp-pb-sm-64 hp-pb-120">
      <div className="hp-landing-container">
        <Row gutter={[50, 24]} align="middle" justify="center">
          <Col>
            <img src={geekWire.src} alt="GeekWire" />
          </Col>

          <Col>
            <img src={slack.src} alt="Slack" />
          </Col>

          <Col>
            <img src={envato.src} alt="Envato" />
          </Col>

          <Col>
            <img src={usaToday.src} alt="USA Today" />
          </Col>

          <Col>
            <img src={forbes.src} alt="Forbes" />
          </Col>
        </Row>
      </div>
    </section>
  )
}
