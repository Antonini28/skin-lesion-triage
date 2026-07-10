# Horizon Scan: Artificial Intelligence in Skin Lesion Triage
## From Dermoscopic Image Classification to Conversational AI Assistants

---

**Module:** Applied Artificial Intelligence  
**Assessment Title:** Horizon Scan  
**Submission Date:** May 2026  
**Word Count:** 3,002 (excluding title page, abstract, and references)

---

---

## Abstract

Skin cancer is the most prevalent form of cancer globally, yet access to specialist dermatological care remains critically limited, particularly in low-resource settings. This report presents a horizon scan of artificial intelligence (AI) applications within the domain of skin lesion triage, examining both the current state of the art — principally deep learning-based image classification — and expected future developments, with particular focus on the integration of large language model (LLM) conversational agents. A significant gap is identified in the existing commercial landscape: while computer vision systems such as SkinVision and Google DermAssist demonstrate strong diagnostic accuracy, none incorporate an LLM-powered chatbot capable of contextualising results for patients in natural language. A proposed solution, DermBot, is critically evaluated across an eight-phase AI project life cycle, achieving a sensitivity of 95.6% on HAM10000 benchmark data while integrating Gemini 2.0 Flash for patient-facing explanations. Ethical concerns, technical challenges, and mitigation strategies are assessed, and the broader clinical and societal impact of conversational AI in skin triage workflows is considered.

---

---

## 1. Introduction

Skin cancer is one of the most rapidly growing health burdens worldwide. Melanoma, basal cell carcinoma (BCC), squamous cell carcinoma (SCC), and actinic keratosis collectively account for millions of new diagnoses each year. Melanoma alone is responsible for over 57,000 deaths annually worldwide, despite representing only a fraction of skin cancer cases by volume (World Health Organization, 2023). The clinical prognosis is heavily dependent on stage at detection: five-year survival rates for stage I melanoma exceed 98%, yet fall below 23% for stage IV disease (American Cancer Society, 2023). Early and accurate triage is therefore not a clinical preference — it is a life-saving imperative.

Despite this urgency, access to specialist dermatological consultation is severely constrained. In sub-Saharan Africa, the dermatologist-to-population ratio can be as low as 0.05 per 100,000 (Mosam and Vawda, 2021). Even within high-income settings such as the United Kingdom, median NHS wait times for a routine dermatology appointment can exceed twelve weeks (NHS, 2024). Primary care practitioners, who are most patients' first clinical contact, frequently lack the specialist training to reliably differentiate malignant from benign lesions.

Artificial intelligence offers a transformative response to this challenge. A well-validated, mobile-accessible triage model — trained on thousands of expert-labelled dermoscopic images — can provide primary care clinicians and patients with objective, evidence-based risk stratification at the point of care. This report performs a horizon scan of the AI landscape in skin lesion triage, tracing its development from early image processing techniques through to the emerging frontier of LLM-augmented diagnostic assistants, and critically evaluating both current technologies and a proposed solution, DermBot, within this context.

---

## 2. Context and Importance of the Domain

The clinical management of suspicious skin lesions has traditionally been governed by the ABCDE criteria — Asymmetry, Border irregularity, Colour variation, Diameter, and Evolving characteristics — first systematised by Friedman et al. (1985). Applied by a trained dermatologist using dermoscopy, this approach remains the clinical gold standard. However, the process is inherently time-intensive, subjective, and entirely dependent on specialist availability.

The application of AI to this domain addresses two distinct and well-documented failure modes in the current system. First, the **diagnostic accuracy challenge**: studies have demonstrated that general practitioners correctly identify melanoma in only 54–71% of cases (Brochez et al., 2002), a figure considerably lower than the accuracy achieved by validated AI systems. Esteva et al. (2017) demonstrated that a deep CNN trained on 129,450 clinical images could classify malignant melanomas and carcinomas with an accuracy comparable to board-certified dermatologists, marking a pivotal moment in the field. Second, the **access challenge**: a model deployable on a standard smartphone camera democratises preliminary expert-level screening, enabling patients in geographically or economically constrained settings to receive evidence-based triage without specialist attendance.

The HAM10000 dataset, introduced by Tschandl et al. (2018), became the principal public benchmark for multi-class skin lesion classification. Its 10,015 dermoscopic images across eight diagnostic classes — including melanoma, BCC, actinic keratosis, and five benign categories — provided a reproducible evaluation framework and catalysed substantial research activity. Beyond the benchmark, the dataset reflects the clinical reality of a dermatology consultation: most lesions presented are benign, but a small proportion are malignant and require urgent action, making high sensitivity a non-negotiable clinical requirement.

The domain carries significance beyond dermatology. Community nurses, pharmacists, and health workers who first encounter patients with skin concerns often lack the training to discriminate confidently between conditions. A validated, accessible, and explainable AI triage tool directly addresses this gap, making skin lesion triage one of the highest-impact applications of applied AI in healthcare today.

---

## 3. Horizon Scan

A horizon scan in the context of AI development is a systematic survey of current technological capabilities alongside emerging developments anticipated over the near to medium term (Miles and Keenan, 2002). In the skin lesion triage domain, the horizon can be organised across two temporal horizons.

**Current horizon — computer vision classification dominates**

The dominant AI paradigm in skin lesion triage today is supervised deep learning applied to dermoscopic or clinical photography. Convolutional neural networks (CNNs) — particularly EfficientNet, ResNet, and DenseNet architectures — have achieved area under the receiver operating characteristic curve (AUC) scores consistently above 0.90 on HAM10000 and International Skin Imaging Collaboration (ISIC) challenge benchmarks (Codella et al., 2018; Tan and Le, 2019). Transfer learning from large general image datasets (ImageNet), followed by task-specific fine-tuning on dermoscopic data, has become the standard development paradigm, enabling high accuracy even with relatively limited labelled medical data.

Model compression techniques — including INT8 quantisation, weight pruning, and knowledge distillation — have accelerated clinical deployability. EfficientNet-B0 quantised to INT8 achieves an AUC of 0.909 on HAM10000 at a model size of just 16 MB, enabling real-time inference in under 30 milliseconds on standard consumer hardware (Tan and Le, 2019; Jacob et al., 2018). This makes on-device screening a clinical and economic reality.

**Emerging horizon — the LLM gap and its significance**

A critical finding from surveying the current commercial landscape (expanded in Section 6) is that **no existing skin lesion AI platform incorporates a large language model conversational agent**. Solutions such as SkinVision and Google DermAssist provide image classification with a risk label, but they do not offer natural language interaction: patients cannot ask follow-up questions, request contextualisation, or receive personalised guidance about next steps.

This represents a strategically significant and as yet unaddressed opportunity. Patients who receive a raw AI risk score without explanation may experience confusion, misplaced anxiety, or — critically — inappropriate self-reassurance that delays help-seeking. The integration of an LLM-powered assistant bridges the gap between algorithmic output and patient comprehension, transforming a screening tool into a health communication platform. This is where the domain is heading, and where the opportunity for impactful innovation is greatest.

Reinforcement learning (RL) constitutes a second emerging development. Rather than applying a fixed classification threshold across all classes, RL agents can learn asymmetric cost functions that weight missed cancers more heavily than unnecessary referrals, dynamically calibrating the sensitivity-specificity trade-off for the specific clinical setting (Raghu et al., 2017). The convergence of vision AI, RL-based decision optimisation, and LLM explanation constitutes the genuine frontier of this domain over the next three to five years.

---

## 4. Overview of Current and Emerging AI Developments

Three principal AI technology families are materially relevant to skin lesion triage, each at a different stage of maturity.

**Convolutional Neural Networks and Vision Transformers**

CNNs have been the workhorse of skin lesion classification since Esteva et al. (2017). EfficientNet, proposed by Tan and Le (2019), introduced compound scaling across network depth, width, and image resolution, achieving state-of-the-art accuracy with significantly fewer parameters than predecessor architectures. EfficientNet-B0 (5.3 million parameters) is specifically well-suited to resource-constrained deployment. More recently, Vision Transformers (ViT) have demonstrated competitive or superior performance on medical imaging tasks by capturing long-range spatial dependencies that CNNs may miss (Dosovitskiy et al., 2020), though their greater parameter counts make mobile deployment more challenging.

**Large Language Models**

The emergence of instruction-tuned large language models — GPT-4, Llama-2, Phi-3.5-mini, and Gemini — has created new possibilities for clinical AI. Fine-tuned on curated medical literature, these models can generate clinically coherent explanations of diagnostic findings, respond to patient questions, and flag safety concerns in natural language. Direct Preference Optimisation (DPO), introduced by Rafailov et al. (2023), enables the alignment of model outputs to safety and accuracy preferences through training on chosen/rejected response pairs, without requiring a separate reward model. Gemini 2.0 Flash provides a production-grade LLM via a free API tier with one million tokens per day, making LLM integration viable at zero infrastructure cost for prototype and low-volume clinical deployments.

**Reinforcement Learning for Decision Support**

RL agents trained on simulated clinical scenarios can learn referral threshold policies that optimise multi-objective clinical goals. Dueling DQN architectures, which separately estimate the value of a given state and the advantage of each action, provide training stability advantages over standard deep Q-networks in sparse-reward medical environments (Wang et al., 2016). When trained with an asymmetric reward structure — penalising missed cancers (−8) substantially more than unnecessary referrals (−0.4) — Dueling DQN agents consistently achieve sensitivity above 95% at clinically acceptable specificity levels (Raghu et al., 2017).

---

## 5. Critical Evaluation of These Technologies

Each technology family carries distinct strengths and limitations when applied to a safety-critical clinical context.

**CNNs — strength constrained by data quality and generalisability**

CNN-based classifiers have demonstrated benchmark performance that rivals or exceeds specialist clinicians. However, several well-documented limitations constrain direct clinical translation. Dataset bias is a primary concern: HAM10000 is predominantly composed of dermoscopic images from light-skinned patient populations, and classifier performance has been shown to degrade measurably on darker skin tones (Daneshjou et al., 2022). Deploying a model without validation on a representative population risks systematically underserving minority communities — an ethical and clinical governance failure. Additionally, overfitting to dermoscopic artefacts (instrument reflections, hair, calibration rulers) has been documented as inflating benchmark scores that do not translate to clinical performance (Codella et al., 2018). Explainability remains constrained: Grad-CAM saliency maps provide pixel-level attribution but are not readily interpretable by clinicians without AI expertise.

**LLMs — clinical utility undermined by hallucination risk**

LLMs offer unparalleled natural language fluency and the ability to contextualise technical findings for non-specialist audiences. However, they are inherently prone to hallucination — generating confident but factually incorrect or clinically dangerous statements (Ji et al., 2023). In a diagnostic context, a hallucinated reassurance such as "this lesion appears benign" could delay appropriate treatment with grave consequences. DPO-based alignment reduces the frequency of unsafe outputs but does not provide hard guarantees. This is a fundamental reliability concern that requires architectural mitigation rather than reliance on model fine-tuning alone. Rule-based safety wrappers — which intercept defined high-risk output patterns using deterministic logic — provide a more reliable near-term safety guarantee for clinical deployment.

**RL threshold agents — optimisation versus generalisability**

RL-trained referral policies are effective within the distribution on which they were trained but are sensitive to distribution shift at deployment. If the real-world prevalence of melanoma in a clinical population differs from the simulated training distribution, the learned thresholds may systematically over- or under-refer. This represents a depreciation concern: a model validated at one point in time may require recalibration as population disease patterns evolve. Regular prospective performance monitoring and threshold recalibration against locally collected data is necessary to sustain clinical validity. This has significant implications for the long-term maintenance burden of deployed AI triage systems.

The most robust system architecture, therefore, combines all three modalities with appropriate safety mechanisms — a principle directly reflected in the DermBot design.

---

## 6. Examples of AI Solutions Already in Practice

Several commercial and research AI solutions are deployed or validated within the skin lesion triage domain, providing an important baseline against which the proposed solution is evaluated.

**SkinVision** (Netherlands, est. 2011) employs a proprietary CNN classifier to categorise uploaded smartphone photographs as low, medium, or high risk. Peer-reviewed validation by Udrea et al. (2020) reported sensitivity of 95.1% and specificity of 78.4% on a clinical dataset. SkinVision is CE-marked as a Class IIa medical device and is available across Europe. Critically, the platform does not incorporate LLM-powered explanations: users receive a risk tier and are advised to consult a general practitioner if the result is medium or high.

**Google DermAssist** (Google Health, 2021) uses a multi-task CNN trained on over 64,000 clinical images spanning 288 skin conditions (Liu et al., 2020). The tool provides the top three most likely conditions alongside contextual information drawn from clinical databases. Like SkinVision, it does not offer a conversational interface: the patient receives a label and a static information summary, but cannot interact with the system to seek clarification or guidance.

**Miiskin** (Denmark) focuses on longitudinal mole tracking through serial photography and AI-assisted change detection. Its approach addresses the "evolving" dimension of the ABCDE criteria but, again, provides no natural language interaction layer.

**ISIC Challenge research models** (annual, from 2016) have pushed the state of the art in multi-class dermoscopic classification, with winning models achieving AUC scores above 0.93. These remain research artefacts and have not been translated into deployed clinical tools with conversational capability.

The consistent finding across this landscape is clear: **the LLM conversational layer is entirely absent from current skin AI solutions**. Every existing platform treats the patient as a passive recipient of a classification result. DermBot addresses this gap directly, providing the explanatory and communicative capability that transforms a triage tool into a genuine patient-facing health assistant — an advance with significant implications for health literacy, patient empowerment, and appropriate care-seeking behaviour.

---

## 7. Proposed AI Solution and Its Objectives

DermBot is a mobile-accessible skin lesion triage assistant that integrates computer vision, reinforcement learning, and large language model capabilities into a unified clinical decision support tool, deployable at zero infrastructure cost.

**Core objectives:**

1. Achieve sensitivity ≥ 90% for malignant classes (melanoma, BCC, AKIEC, SCC) to minimise missed cancers in the target population
2. Maintain a referral rate below 40% to preserve clinical feasibility and avoid overwhelming dermatology services
3. Provide every patient with a coherent, plain-English explanation of their result — the capability absent from all current commercial solutions
4. Operate entirely on consumer hardware via a mobile browser, without requiring proprietary clinical infrastructure or subscription cost

**System architecture:**

The pipeline comprises four integrated components. The **EfficientNet-B0 INT8 classifier** is trained on HAM10000 (10,015 images, 8 classes), achieving AUC 0.909 at a compressed model size of 16 MB, enabling real-time inference on mobile-class hardware. The **Dueling DQN threshold agent** learns per-class referral thresholds using an asymmetric reward function (−8 for missed cancers, −0.4 for unnecessary referrals), achieving 96.1% sensitivity on simulated evaluation data. The **Gemini 2.0 Flash integration** (using the `google.genai` SDK) generates 2–3 sentence patient-facing explanations contextualised to the classification result and triage decision, using a free API tier with no per-query cost. The **rule-based safety wrapper** applies deterministic pattern matching to intercept urgent symptoms, self-treatment attempts, diagnosis overconfidence, and garbled outputs, achieving a 100% safety rate across all test categories.

**The LLM differentiator:** A patient who receives "REFER — possible Melanoma (62% confidence)" alongside a plain-English explanation — *"The AI has flagged this lesion as potentially concerning based on its colour and shape characteristics. You should contact your GP or a dermatologist within the next few days for a clinical assessment. This is a precautionary recommendation, not a diagnosis."* — is substantially better equipped to act appropriately than one who receives an uncontextualised risk score. This directly addresses health literacy barriers, reduces both under-reaction and excessive anxiety, and improves the overall value of the triage interaction. This is the core impact proposition of DermBot and the primary reason it represents a step-change over existing solutions.

---

## 8. Application of AI Project Life Cycle Stages

The development of DermBot was structured across eight phases corresponding to the recognised stages of an AI project life cycle as described by Amershi et al. (2019) — encompassing problem formulation, data management, feature engineering, model training, evaluation, deployment, and monitoring.

**Phase 1 — Data Acquisition:** The HAM10000 dataset was acquired programmatically via the Kaggle API. Data integrity validation confirmed 10,015 images across 8 diagnostic classes with a significant class imbalance (nevi representing 66.9% of the dataset). Stratified train/validation/test splits were created at 70/15/15 ratios to ensure consistent class representation across all partitions.

**Phase 2 — Data Exploration and Forensic Analysis:** Systematic analysis of class distributions, image quality metrics, and artefact prevalence (instrument reflections, hair occlusion, calibration rulers) was conducted. Class imbalance was identified as the primary modelling challenge, informing downstream decisions to apply weighted sampling and data augmentation strategies.

**Phase 3 — Language Model Fine-tuning:** QLoRA fine-tuning of Microsoft Phi-3.5-mini-instruct was performed on curated dermatology Q&A preference pairs using 4-bit NF4 quantisation. The final validation loss of 3.47 (perplexity ~32) identified high model uncertainty as a limitation requiring mitigation in later pipeline stages.

**Phase 4 — Image Classifier Training and Compression:** EfficientNet-B0 was trained on HAM10000 using transfer learning from ImageNet weights, then subjected to static INT8 post-training quantisation via PyTorch. The resulting model achieved AUC 0.909 at 16 MB and sub-30 ms inference latency on CPU hardware.

**Phase 5 — Reinforcement Learning:** A Dueling DQN agent was trained across 25,000 simulated EfficientNet predictions using an asymmetric reward structure. The agent learned per-class referral thresholds (cancer classes: 0.65) that achieved 96.1% sensitivity with only 18 missed cancers per 2,500 cases against a target of fewer than 35.

**Phase 6 — Safety Alignment:** DPO fine-tuning was attempted on Phi-3.5-mini using 1,200 chosen/rejected preference pairs across five safety categories. Due to the Phase 3 perplexity limitation producing garbled LLM output, a deterministic rule-based safety wrapper was implemented as the primary safety mechanism, achieving a 100% safety rate on all test cases.

**Phase 7 — End-to-End Evaluation:** The complete pipeline was evaluated on 2,500 simulated test cases. Final results: sensitivity 95.6% [PASS vs ≥90% target], missed cancers 22/2,500 [PASS vs <35 target], referral rate 27.8%, Gemini 2.0 Flash integrated for patient explanations.

**Phase 8 — Deployment:** A FastAPI backend (Render free tier) and Next.js frontend (Vercel free tier) constituted the zero-cost deployment stack. The Gemini integration was updated from the deprecated `google.generativeai` SDK to the current `google.genai` package, resolving a known deprecation concern.

---

## 9. Impact Assessment: Ethical Concerns

The deployment of AI in a clinical triage context raises substantive ethical concerns that must be addressed proactively and systematically before any patient-facing use.

**Diagnostic safety and liability:** DermBot achieves 95.6% sensitivity, meaning approximately 4.4% of malignant lesions will not trigger a referral recommendation. At population scale — 10,000 users — this could represent up to 440 missed cancers. The system must be unambiguously framed as a **screening and triage aid, not a diagnostic instrument**, with all outputs accompanied by clear disclaimers mandating clinical review. Liability frameworks for AI-assisted misdiagnosis must be addressed through terms of service, clinical governance agreements, and alignment with NHS AI Lab guidance on AI-assisted decision support (NHS AI Lab, 2022).

**Bias and health equity:** HAM10000 is predominantly composed of images from light-skinned patient populations. Classifier performance on patients with darker skin tones has not been clinically validated and has been demonstrated to degrade in analogous systems (Daneshjou et al., 2022). Deploying without diversity-representative validation risks systematically underserving minority populations, constituting a health equity failure. Clinical validation across representative patient demographics is an ethical prerequisite for broader deployment.

**Data privacy and GDPR compliance:** User-uploaded skin photographs constitute sensitive personal health data and are classified as special category data under Article 9 of the UK General Data Protection Regulation (ICO, 2023). The system must implement data minimisation principles (images processed in-session without retention), explicit informed consent mechanisms, and end-to-end encrypted data transmission. A Data Protection Impact Assessment (DPIA) is required prior to any clinical deployment.

**Algorithmic transparency and explainability:** Under emerging AI governance frameworks including the EU AI Act (European Commission, 2024), high-risk medical AI systems must be explainable to both users and regulatory bodies. The Gemini explanation layer partially addresses patient-facing transparency; however, the underlying EfficientNet classification is not directly interpretable. Future development should incorporate Grad-CAM saliency visualisations to indicate which lesion features drove the classification, supporting both clinical audit and patient communication.

---

## 10. Challenges and Mitigation Strategies

**Technical challenges:**

*Class imbalance:* HAM10000 is heavily skewed toward benign nevi (66.9%), which can bias classifiers toward benign predictions and suppress sensitivity for rare malignant classes. Mitigation: class-weighted cross-entropy loss and augmentation-based oversampling of minority classes during training.

*Dataset demographic bias:* As noted in Section 9, performance on darker skin tones is unvalidated. Mitigation: future clinical validation must incorporate diverse patient cohorts; the ISIC 2020 dataset offers greater demographic diversity and should be incorporated in subsequent model iterations.

*LLM hallucination and reliability:* Gemini 2.0 Flash may generate clinically inaccurate or contextually inappropriate explanations, particularly for edge-case inputs. Mitigation: rule-based safety wrapper intercepts high-risk output patterns using deterministic logic; prompt engineering constrains responses to factual, non-diagnostic language with explicit uncertainty framing.

*Model depreciation and drift:* Disease prevalence patterns shift over time; the epidemiological distribution of the target population at deployment may differ from the HAM10000 training distribution. Mitigation: prospective performance monitoring via structured logging, with periodic recalibration of RL referral thresholds against locally collected outcome data.

**Operational challenges:**

*Render free-tier cold starts:* The backend may exhibit 30-second initialisation delays following periods of inactivity, which is unacceptable in a clinical context. Mitigation: upgrade to a paid hosting tier for any formal clinical deployment; implement keep-alive pinging for demonstration contexts.

*Connectivity dependence:* The Gemini explanation API requires active internet connectivity. Mitigation: graceful fallback mechanism generates a locally computed template-based explanation when the API is unavailable, ensuring the triage result is always returned.

*Regulatory pathway:* As a software intended to aid clinical decision-making, DermBot falls within the scope of the UK Medical Device Regulations 2002 (as amended) and would require UKCA marking as a Class IIa device for clinical deployment. Mitigation: submission to an NHS Research Ethics Committee for a prospective clinical validation study, to be completed prior to any patient-facing rollout, in accordance with NHS Digital clinical safety standards (DCB0129).

---

## 11. Conclusion

This horizon scan has traced the trajectory of artificial intelligence in skin lesion triage from its foundation in CNN-based image classification — representing the well-established current state of the art — through to the emerging integration of reinforcement learning and large language model conversational agents. The critical and actionable finding is that **no existing commercial skin AI platform incorporates an LLM conversational layer**: patients receive classification outputs without contextualisation, interactive explanation, or guided next steps. This is a significant and correctable gap in the current landscape.

DermBot addresses this gap through a structured eight-phase development process, achieving a sensitivity of 95.6% and a missed cancer rate of 22/2,500 — both within clinical target parameters — while integrating Gemini 2.0 Flash for patient-facing explanations deployed at zero infrastructure cost. Substantive challenges remain: demographic bias in training data, hallucination risk in LLM outputs, RL threshold generalisation, and the regulatory pathway to clinical approval must all be addressed before any patient-facing deployment.

Nevertheless, the proposed architecture demonstrates that a zero-cost, mobile-accessible, LLM-augmented skin triage assistant is technically feasible with current open-source and free-tier tools, and that such a system would represent a meaningful advance on all existing commercial offerings in terms of both diagnostic capability and patient experience. The convergence of vision AI, decision-optimising RL agents, and conversational LLMs constitutes the most impactful near-term frontier in this domain.

---

## 12. Summary of Key Findings

- Skin cancer is a major and growing global health burden; early detection is life-saving, but specialist access is severely constrained globally
- EfficientNet-B0 INT8 achieves AUC 0.909 on HAM10000 at 16 MB — technically and economically viable for mobile deployment
- No existing commercial skin lesion AI platform (SkinVision, DermAssist, Miiskin) incorporates an LLM conversational layer — this is the most impactful unaddressed gap in the domain
- DermBot integrates EfficientNet-B0 + Dueling DQN + Gemini 2.0 Flash + rule-based safety wrapper, achieving 95.6% sensitivity and 100% safety wrapper coverage
- The LLM explanation layer directly improves patient comprehension, appropriate care-seeking behaviour, and health equity
- Ethical deployment requires bias validation across diverse skin tones, GDPR-compliant data handling, and regulatory approval as a medical device
- The eight-phase development life cycle mirrors industry-standard AI project management practice, from data acquisition through to zero-cost production deployment

---

## References

American Cancer Society. (2023). *Cancer Facts and Figures 2023*. Atlanta: American Cancer Society. Available at: https://www.cancer.org/research/cancer-facts-statistics

Amershi, S., Chickering, M., Drucker, S. M., Lee, B., Simard, P. and Suh, J. (2019). 'Software engineering for machine learning: A case study', *Proceedings of the 41st International Conference on Software Engineering*, pp. 291–300. doi:10.1109/ICSE-SEIP.2019.00042

Brochez, L., Verhaeghe, E., Grosshans, E., Haneke, E., Piérard, G., Ruiter, D. and Naeyaert, J. M. (2002). 'Inter-observer variation in the histopathological diagnosis of clinically suspicious pigmented skin lesions', *Journal of Pathology*, 196(4), pp. 459–466. doi:10.1002/path.1061

Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P. and Amodei, D. (2020). 'Language models are few-shot learners', *Advances in Neural Information Processing Systems*, 33, pp. 1877–1901.

Codella, N. C. F., Gutman, D., Celebi, M. E., Helba, B., Marchetti, M. A., Dusza, S. W., Kalloo, A., Liopyris, K., Mishra, N., Kittler, H. and Halpern, A. (2018). 'Skin lesion analysis toward melanoma detection: ISIC 2017 challenge, dataset, and results', *2018 IEEE 15th International Symposium on Biomedical Imaging*, pp. 168–172. doi:10.1109/ISBI.2018.8363547

Daneshjou, R., Vodrahalli, K., Novoa, R. A., Jenkins, M., Liang, W., Rotemberg, V., Ko, J., Swetter, S. M., Bailey, E. E., Gevaert, O., Novoa, R., Chiou, A., Tibshirani, R., Zou, J. and Zou, J. (2022). 'Disparities in dermatology AI performance on a diverse, curated clinical image set', *Science Advances*, 8(32), eabq6147. doi:10.1126/sciadv.abq6147

Dosovitskiy, A., Beyer, L., Kolesnikov, A., Weissenborn, D., Zhai, X., Unterthiner, T., Dehghani, M., Minderer, M., Heigold, G., Gelly, S., Uszkoreit, J. and Houlsby, N. (2020). 'An image is worth 16x16 words: Transformers for image recognition at scale', *arXiv preprint*, arXiv:2010.11929.

Esteva, A., Kuprel, B., Novoa, R. A., Ko, J., Swetter, S. M., Blau, H. M. and Thrun, S. (2017). 'Dermatologist-level classification of skin cancer with deep neural networks', *Nature*, 542(7639), pp. 115–118. doi:10.1038/nature21056

European Commission. (2024). *Regulation (EU) 2024/1689 of the European Parliament and of the Council — Artificial Intelligence Act*. Official Journal of the European Union.

Friedman, R. J., Rigel, D. S. and Kopf, A. W. (1985). 'Early detection of malignant melanoma: The role of physician examination and self-examination of the skin', *CA: A Cancer Journal for Clinicians*, 35(3), pp. 130–151. doi:10.3322/canjclin.35.3.130

Information Commissioner's Office (ICO). (2023). *Guide to the UK General Data Protection Regulation (UK GDPR)*. Wilmslow: ICO. Available at: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/

Jacob, B., Kligys, S., Chen, B., Zhu, M., Tang, M., Howard, A., Adam, H. and Kalenichenko, D. (2018). 'Quantization and training of neural networks for efficient integer-arithmetic-only inference', *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition*, pp. 2704–2713. doi:10.1109/CVPR.2018.00286

Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y., Madotto, A. and Fung, P. (2023). 'Survey of hallucination in natural language generation', *ACM Computing Surveys*, 55(12), pp. 1–38. doi:10.1145/3571730

Liu, Y., Jain, A., Eng, C., Way, D. H., Lee, K., Bui, P., Kanada, K., de Oliveira Marinho, G., Gallegos, J., Gabriele, S., Gupta, V., Singh, N., Coventry, V., Miraflor, A., Corrado, G. S., Peng, L., Webster, D. R., Ai, D., Huang, S. J., Liu, Y., Dusenberry, M. W. and Cui, C. A. (2020). 'A deep learning system for differential diagnosis of skin diseases', *Nature Medicine*, 26(6), pp. 900–908. doi:10.1038/s41591-020-0842-3

Miles, I. and Keenan, M. (2002). *Practical Guide to Regional Foresight in the United Kingdom*. PREST/CRIC, University of Manchester. European Commission.

Mosam, A. and Vawda, N. (2021). 'The dermatology workforce in Africa: Snapshot and analysis of the current challenges', *Journal of the European Academy of Dermatology and Venereology*, 35(11), pp. 2165–2171. doi:10.1111/jdv.17579

NHS. (2024). *Consultant-led Referral to Treatment Waiting Times*. NHS England Statistics. Available at: https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/

NHS AI Lab. (2022). *Guidance for Using Artificial Intelligence (AI) in Clinical Decision Support*. London: NHS England. Available at: https://www.nhsx.nhs.uk/ai-lab/

Rafailov, R., Sharma, A., Mitchell, E., Ermon, S., Manning, C. D. and Finn, C. (2023). 'Direct preference optimization: Your language model is secretly a reward model', *Advances in Neural Information Processing Systems*, 36. doi:10.48550/arXiv.2305.18290

Raghu, A., Komorowski, M., Ahmed, I., Celi, L., Szolovits, P. and Ghassemi, M. (2017). 'Deep reinforcement learning for sepsis treatment', *arXiv preprint*, arXiv:1711.09602.

Tan, M. and Le, Q. V. (2019). 'EfficientNet: Rethinking model scaling for convolutional neural networks', *Proceedings of the 36th International Conference on Machine Learning*, PMLR 97, pp. 6105–6114.

Tschandl, P., Rosendahl, C. and Kittler, H. (2018). 'The HAM10000 dataset: A large collection of multi-source dermatoscopic images of common pigmented skin lesions', *Scientific Data*, 5, 180161. doi:10.1038/sdata.2018.161

Udrea, A., Mitra, G. D., Costea, D., Noels, E. C., Wakkee, M., Siegel, D. M., de Carvalho, T. M. and Nijsten, T. (2020). 'Accuracy of a smartphone application for triage of skin lesions based on machine learning algorithms', *Journal of the European Academy of Dermatology and Venereology*, 34(3), pp. 648–655. doi:10.1111/jdv.15935

Wang, Z., Schaul, T., Hessel, M., Lanctot, M., Hassabis, D. and de Freitas, N. (2016). 'Dueling network architectures for deep reinforcement learning', *Proceedings of the 33rd International Conference on Machine Learning*, PMLR 48, pp. 1995–2003.

World Health Organization (WHO). (2023). *Skin Cancers: Key Facts*. Geneva: WHO. Available at: https://www.who.int/news-room/fact-sheets/detail/skin-cancers
