/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

export default function MenuLogo() {
    return (
        <Link href="/" passHref>
            <>
                <img
                    className="hp-logo"
                    src={
                        'https://toppng.com/uploads/preview/hamburger-png-vector-picture-11547059710uuexgsn6ph.png'
                    }
                    alt="logo"
                />

                <span className="h3 d-font-weight-800 hp-text-color-primary-1 hp-mb-6">
                    .
                </span>

                <span
                    className="hp-p1-body hp-font-weight-500 hp-text-color-black-40 hp-mb-16 hp-ml-4"
                    style={{
                        letterSpacing: -1.5,
                    }}
                >
                    v.0.0.1
                </span>
            </>
        </Link>
    )
}
