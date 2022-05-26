/* eslint-disable @next/next/no-img-element */
import heroImage from '../../src/assets/images/pages/landing/hero-image.svg'
import emoji1 from '../../src/assets/images/pages/landing/emoji-1.png'
import emoji2 from '../../src/assets/images/pages/landing/emoji-2.png'
import emoji3 from '../../src/assets/images/pages/landing/emoji-3.png'
import emoji4 from '../../src/assets/images/pages/landing/emoji-4.png'

export default function LandingHero() {
    return (
        <section className="hp-landing-hero hp-pt-16">
            <div className="hp-landing-hero-title hp-text-center hp-mt-64 hp-px-24">
                <h1 className="hp-mb-sm-24 hp-mb-32">
                    Pay Safe Anytime, Anywhere 🥊
                </h1>

                <p className="h4 hp-font-weight-400 hp-text-color-black-60">
                    YODA is an the obligations of business it will frequently
                    occur that pleasures have to be repudiated and annoyances
                    accepted.
                </p>
            </div>

            <div className="hp-landing-hero-img hp-mt-96">
                <div className="hp-landing-hero-rectangle hp-bg-warning-1"></div>
                <div className="hp-landing-hero-circle hp-bg-info-1"></div>

                <div className="hp-landing-hero-img-container">
                    <div
                        className="hp-landing-hero-img-item"
                        style={{
                            backgroundImage: 'url(' + heroImage.src + ')',
                        }}
                    ></div>
                </div>
            </div>

            <div className="hp-landing-hero-img-left">
                <div className="hp-landing-hero-img-emoji">🖖</div>

                <div className="hp-landing-hero-img-emoji">
                    <img src={emoji1.src} alt="Emoji1" />
                </div>

                <div className="hp-landing-hero-img-emoji">😎</div>

                <div className="hp-landing-hero-img-emoji">
                    <img src={emoji2.src} alt="Emoji2" />
                </div>
            </div>

            <div className="hp-landing-hero-img-right">
                <div className="hp-landing-hero-img-emoji">🌍</div>

                <div className="hp-landing-hero-img-emoji">😇</div>

                <div className="hp-landing-hero-img-emoji">
                    <img src={emoji3.src} alt="Emoji3" />
                </div>

                <div className="hp-landing-hero-img-emoji">
                    <img src={emoji4.src} alt="Emoji4" />
                </div>
            </div>
        </section>
    )
}
