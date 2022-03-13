import LandingCompanies from './companies'
import LandingContent1 from './content-1'
import LandingContent2 from './content-2'
import LandingFeatures from './features'
import LandingFooter from './footer'
import LandingHeader from './header'
import LandingHero from './hero'
import LandingPeople from './people'
import LandingPricing from './pricing'

export default function Landing() {
  return (
    <div className="hp-landing hp-bg-black-0 hp-bg-dark-90">
      <LandingHeader />

      <LandingHero />
      <LandingCompanies />
      <LandingFeatures />
      <LandingContent1 />
      <LandingContent2 />
      <LandingPeople />
      <LandingPricing />
      <LandingFooter />
    </div>
  )
}
