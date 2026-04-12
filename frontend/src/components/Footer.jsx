export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <p className="footer-legal">
                    This tool does not provide a diagnosis. Consult a qualified dermatologist for evaluation.
                </p>
                <p className="footer-copy">
                    &copy; {new Date().getFullYear()} SkinTriage AI
                </p>
            </div>
        </footer>
    );
}
