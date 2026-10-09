## 1. Introduction and Related Work

A matrix exponential (ME) is a function defined as the solution of a system of *n* linear, homogeneous, first-order, ordinary differential equations (ODEs) with constant coefficients. Equation (1) outlines a formal writing of the ME function: *Y*(*t*) = *e*<sup>Mt</sup>*Y*(0) *↔ Y*<sup>′</sup>(*t*) = *MY*(*t*), *M ∈* C<sup>n×n</sup>, (1)

where *M ∈* C<sup>n×n</sup> is an arbitrary matrix, *Y*(*t*) is a dynamic over time, and *Y*(0) is the initial condition of the dynamic system.

An ME is a widely used function [1–5]. For instance, it is used in linear control systems in order to find the state space, as the ME plays a fundamental role in the solution of the state equations [6,7]. In a more general sense, it plays a role in exploring and solving a wide range of dynamical systems represented by a set of ODEs [1]. Due to their usefulness in many applications, MEs have been widely investigated [1,8–11].

The analytical solution of Equation (1) takes the form [8]:

<div class="equation" id="eq-1"><img src="figures/eq-1.webp" width="313" height="49" alt="eM = ∞ ∑ i=0 Mi i! . (2)" loading="lazy" decoding="async"></div>

Equation (2) is also known as the *naive* ME algorithm. It is numerically unstable, slow, and relatively inaccurate when considering floating-point arithmetic [1]. Recently, in the context of modern computer systems, numerical computation of MEs has become more relevant than ever before [1,12]. One of the main challenges associated with computing MEs is the numerical accuracy for any given matrix [9].

One can roughly divide the numerical ME algorithms into two groups: algorithms designed specifically to exploit a property of some groups of matrices (for example, diagonal matrices) and algorithms that are suitable for all matrices. Usually, when one uses an algorithm from the first group, the obtained result is accurate and the computation is stable since the algorithm is explicitly designed to handle the given input matrix. If, for some reason, one uses an inappropriate matrix in such an algorithm, the algorithm more often than not produces a (highly) incorrect result. Algorithms from the second group are usually found in large computational systems as they do not require that the result of the computation, which takes place before the computation of the ME algorithm, satisfies a given condition. This general nature makes these algorithms usable in a wider context [1]. However, each algorithm in this group has a set of matrices that result in large errors or even divergence during computation [1].

One can name several popular examples of such algorithms. First, there is a Taylor series method with a stop condition that is based on Peano’s remainder being smaller than some pre-defined threshold [13]. As a numerical method, it is often slow and inaccurate [1]. Specifically, matrices with small values, in absolute terms, are more likely to produce large errors due to cancellation errors. Second, the Pade-approximation-based algorithm is a two-parameter approximation of the ME Taylor series algorithm, which makes it more robust and well-performing after using scaling and squaring algorithm [1]. However, these algorithms obtain poor results, with the norm of the matrix *||M||* being large. Third, the Cayley–Hamilton ME algorithm provides another form of approximation of the Taylor series. The coefficients of the decomposition of the input matrix are very sensitive to round-off errors as they generate a large error, specifically when the rank of the input matrix (*M*) is significantly smaller than that of the diminution of the matrix [8].

Another family of algorithms takes advantage of the eigenvalues of the input matrix. For instance, there are Lagrange-interpolation-based methods [8]. These methods provide very accurate results on average [1]. However, for an input matrix with close but not equal eigenvalues (i.e., *|λ*<sub>j</sub> *−λ*<sub>k</sub>*| <<* 1), this method has a significant cancellation error as a result of dividing each iteration by *|λ*<sub>j</sub> *− λ*<sub>k</sub>*|*. Matrices with eigenvalues with great algebraic multiplicity will produce significant error and make the algorithm unstable. In a similar manner, the Newton interpolation algorithm is a good example as well. This algorithm is based on a recursive decomposition method of the input matrix and suffers from the same issues as the Lagrange interpolation algorithm.

An additional family of algorithms is the general-purpose ODE solvers. The main idea is that the ME is defined as a solution for a system of ODEs (see Equation (1)). Therefore, it is possible to solve Equation (1) numerically using different approaches such as the Euler, exponential integrator, and Runge–Kutta methods [14–16]. The Krylov methods are widely used to solve MEs for which the matrices are large and sparse [17]. These methods are widely adapted due to the fast and accurate results they produce for sparse matrices, which are becoming more common in multiple applications [17,18]. This class of methods is mainly dependent on the norm of the input matrix [19,20]. For cases for which the input matrix is negative definite, the condition number defines the convergence rate and error boundary [17,21]. However, this class of methods does not allow obtaining the ME itself but the product of the ME with a vector. While of interest in multiple applications, in this work, we aim to obtain the ME, as it can be both analyzed by itself and later multiplied with any vector easily.

Moreover, a large body of work investigates the numerical computation of MEs for the transient analysis of continuous-time Markov chains [22]. Multiple numerical algorithms for MEs are proposed: mostly based on the uniformization method [23]. These methods are shown to handle cases for which stiffness occurs. Nonetheless, [22] shows that even modern continuous-time Markov chain solvers are outperformed by Pade approximation combined with scaling and squaring. Recently, further works focused on the computation time and computational memory requirements of ME as matrices grow in size for multiple realistic cases [24,25].

In this study, we propose a novel L-EXPM algorithm that numerically solves MEs with a high level of accuracy. The L-EXPM is designed to tackle the issues of previous methods by combining the advantages of series-based algorithms (for example, Pade) and the eigenvalue-based methods (for example, Newton) by approximating Putzer’s algorithm.

The remainder of the paper is organized as follows. First, we introduce the proposed L- EXPM algorithm with asymptotic complexity and memory consumption analysis and prove it solves MEs. Second, we numerically evaluate the numerical accuracy of the proposed L-EXPM algorithm relative to other ME algorithms on stiff matrices. Third, we propose a complexity- and numerical-accuracy-optimized decision tree model for numerically solving ME. Finally, we conclude the usage of the proposed L-EXPM with a decision tree and suggest future work.

## 2. The L-EXPM Algorithm

### 2.1. Algorithm

Numerical computation of MEs using L-EXPM is aimed to reduce the error in computing MEs for any given complex square matrix. L-EXPM is based on Putzer’s algorithm [26] for the decomposition of MEs. L-EXPM handles two steps of the original algorithm from a numerical perspective. First, it finds the eigenvalues of the input matrix (*M*). This is not a trivial task, especially for large-size matrices. However, recent power methods, such as the Lanczos algorithm [27], are able to obtain the needed eigenvalues with decent accuracy. Second, rather than solving a system of ODEs recursively to obtain the coefficients of the decomposed matrices, the coefficients are iteratively approximated via an analytical solution of the system of ODEs. A schematic view of the algorithm’s structure is shown in Figure 1.

<figure id="fig-1">
<img src="figures/fig-1.webp" width="630" height="100" alt="A schematic view of the algorithm’s structure" loading="lazy" decoding="async">
<figcaption><strong>Figure 1.</strong> A schematic view of the algorithm’s structure.</figcaption>
</figure>

The L-EXPM algorithm takes a square complex (or real) matrix and returns the ME of this matrix. It works as follows: In line 2, the vector of eigenvalues of the input matrix is obtained using some algorithm that finds numerically the eigenvalues of the input matrix. Any algorithm may be used. Specifically, the Lanczos [27] algorithm has been used with the stability extension proposed by Ojalvo and Newman [28] and the spatial bisection algorithm [29]. In line 3, the eigenvalues that are too close to each other are converted to the same eigenvalue, and eigenvalues that are too close to 0 are converted to 0. In lines 4–5, the initial *r* and *P* (the input matrix decomposition (*P*) and its coefficient) from Putzer’s algorithm are initialized. Lines 6–11 are the main loop of the algorithm, with line 8 being the sum of *r*<sub>i+1</sub>*P*<sub>i</sub>, while *r*<sub>i</sub> in line 9 is an approximation of the *r*<sub>i</sub> shown in [26], as shown in Theorem 1. Specifically, *c*<sub>l</sub> and *a*<sub>k</sub> are the coefficients of the polynomial–exponent representation of *r*<sub>i</sub>, as later described in Equation (10). Line 10 is the iterative calculation of *P*<sub>i</sub>.

In line 3, *controlEigs*(*M*) is a function that replaces every two eigenvalues that satisfy *||λ*<sub>i</sub> *−λ*<sub>j</sub>*|| < ϵ* or one eigenvalue *||λ*<sub>i</sub>*|| < ϵ*, where *ϵ* is an arbitrary small threshold with the same eigenvalue *λ*<sub>i</sub> or 0.

We examine the L-EXPM algorithm’s storage requirements and complexity (Algorithm 1). Analyzing the worst-case scenario, asymptotic complexity, and memory consumption can be performed by dividing the algorithm into two parts: lines 2–5 and 6–11. Assuming that the worst complexity and memory consumption of the algorithm that finds the eigenvalues of the input matrix are *O*(*E*<sub>c</sub>) and *O*(*E*<sub>m</sub>), respectively, and that the input matrix is *n*-dimensional, then it is easy to see that *controlEigs* has *O*(*n*<sup>2</sup>) complexity and *O*(*n*) memory consumption as it compares every two values in a vector. Lines 4 and 5 are the initialization of two matrices, so *O*(1) complexity and *O*(*n*<sup>2</sup>) memory consumption are required. Therefore, this part of the algorithm results in *O*(*max*(*E*<sub>c</sub>, *n*<sup>2</sup>)) complexity and *O*(*E*<sub>m</sub>, *n*<sup>2</sup>) memory consumption.

**Algorithm 1** L-EXPM

- 1: **procedure** L-EXPM(*M*)

<div class="equation" id="eq-2"><img src="figures/eq-2.webp" width="454" height="180" alt="2: Λ ←eigs(M) 3: Λ ←controlEigs(Λ) 4: r ←eΛ[1] 5: P ←Idim(M)×dim(M) 6: i = 1 7: while i ≤dim(M) do 8: expm ←expm + r · P 9: r ←eΛ[i]Σi k=0Σi l=0 −1 (λi−ak) l+1cle(ak−Λ[i])Σl m=0 l! (l−m)!(Λ[i] −ak)l−m 10: P ←P(M −Idim(M)×dim(M)Λ[i + 1]) 11: end while" loading="lazy" decoding="async"></div>

- 12: *return expm*
- 13: **end procedure**

Regarding lines 7–11, we repeat the inner loop *n* times. Inside the inner loop at line 8, there is addition between two matrices, which has *O*(*n*<sup>2</sup>) complexity and memory consumption. In line 9, there are three sums, each bounded by *n*. In addition, in the inner sum, there is a factorial, which is naively calculated in *O*(*l*) in each loop and can be bounded by *O*(*n*) overall, and therefore, in the worst case, it can be calculated as *O*(*n*<sup>4</sup>) complexity and *O*(*n*) memory consumption. Nevertheless, calculating the size of the factorial and storing it in a vector of size *n* reduces the complexity of line 9 to *O*(*n*<sup>3</sup>). In line 10, the more expensive computation is the matrix multiplication, which is bounded by *O*(*n*<sup>3</sup>) complexity and *O*(*n*<sup>2</sup>) memory consumption. Therefore, the algorithm’s complexity is bounded by *O*(*n*<sup>4</sup>) complexity and *O*(*n*<sup>3</sup>) memory consumption. The values of *a*<sub>k</sub> and *c*<sub>l</sub> are determined during the run time as shown in the Proof of Lemma 1.

*2.2. Proof of Soundness and Completeness*

In this section, we provide analytical proof for the soundness and completeness of the L-EXPM algorithm. The proof outlines how to reduce the formula proposed in L-EXPM, lines 8–19, to the formula used in Putzer’s algorithm [26].

**Theorem 1.** *For any given matrix M ∈* C<sup>n×n</sup>*, algorithm L-EXPM solves Equation (1).*

**Proof.** Consider the following equation:

<div class="equation" id="eq-3"><img src="figures/eq-3.webp" width="165" height="27" alt="Y′(t) = MY(t), M ∈Cn×n." loading="lazy" decoding="async"></div>

First, one needs to obtain the eigenvalues of the input matrix *M*. It is possible to find the biggest eigenvalue of *M* using the Lanczos algorithm [27]. Using Ojalvo and Newman’s algorithm, this process is numerically stable [28]. The result of their algorithm is a tridiagonal matrix *T*<sub>m×m</sub>, which is similar to the original matrix *M*. The eigenvalues of *T*<sub>m×m</sub> can be obtained with an error *ϵ* as small as needed using spectral bisection [29].

According to the Putzer algorithm [26], a solution to the ME takes the form:

<div class="equation" id="eq-4"><img src="figures/eq-4.webp" width="463" height="70" alt="Y(t) = Σn−1 j=0 rj+1(t)Pj, such that P0 = I, ∀j ∈[0, n −1] : Pj = Πj k=1(M −λkI), and r′ 1 = λ1r1, r1(0) = 1, ∀j ∈[2, n −1] : r′ j = λjrj + rj−1, rj(0) = 0, (3)" loading="lazy" decoding="async"></div>

where *λ*<sub>i</sub> *∈* Λ are the eigenvalues of *M* ordered from the absolute largest eigenvalue to the smallest one. The solution for *r*<sup>′</sup> <sub>j</sub> = *λ*<sub>j</sub>*r*<sub>j</sub> for any *j ∈* [1, *n −*1] is a case of a non-heterogeneous linear ODE with a constant coefficient and, therefore, takes the form:

<div class="equation" id="eq-5"><img src="figures/eq-5.webp" width="432" height="29" alt="r1 = eλ1t, rj = eλjt R e−λjtrj−1(t)dt −R rj−1(t)dt|t=0 (4)" loading="lazy" decoding="async"></div>

Regarding *P*<sub>j</sub>, it is possible to obtain *P*<sub>j+1</sub> given *P*<sub>j</sub> using the formula:

<div class="equation" id="eq-6"><img src="figures/eq-6.webp" width="340" height="26" alt="Pj+1 = Pj(M −λj+1I), (5)" loading="lazy" decoding="async"></div>

because

<div class="equation" id="eq-7"><img src="figures/eq-7.webp" width="595" height="33" alt="Pj+1 := Πj+1 k=1(M −λkI) and Pj := Πj k=1(M −λkI) →Pj+1 := PjΠj+1 k=j+1(M −λkI) = Pj(M −λj+1I)." loading="lazy" decoding="async"></div>

(*−*1)<sup>j</sup> Equation (1) may diverge if *λ*<sub>1</sub> = 0: then *r*<sub>j</sub> = <sub>λj−1λj</sub> for 2 *≤ j ≤ n* and *r*<sub>1</sub> = 1. In general, this calculation has only precision errors. It may have a significant cancellation error when *λ*<sub>j−1</sub>*λ*<sub>j</sub> *→* 0.

Now, one needs to show that the solution for *r*<sub>j</sub> takes the form shown in line 9 of the L-EXPM algorithm.

**Lemma 1.** *∀j ∈* [1, *n*] : *r*<sub>j</sub>(*t*) := Σ<sup>n</sup> <sub>k=1</sub>*p*<sub>k</sub>(*t*)*e*<sup>akt</sup>*, where p*<sub>k</sub> *are polynomials and a*<sub>k</sub> *∈* C *are constants.*

**Proof of Lemma 1.** Induction on *j*. For *j* = 1, *r*<sub>1</sub> = *e*<sup>λ1t</sup> *−*1, which satisfies the condition. Assume the condition is satisfied for *r*<sub>j</sub>, and we show *r*<sub>j+1</sub> has satisfied the condition. Now, according to Equation (4):

<div class="equation" id="eq-8"><img src="figures/eq-8.webp" width="420" height="37" alt="rj+1 = eλj+1t Z e−λj+1trj(t)dt −eλj+1t Z rj(t)dt|t=0. (6)" loading="lazy" decoding="async"></div>

The second term is the multiplication of a constant by an exponent and therefore satisfies the condition. Now, we examine the first term. Based on the assumption, it takes the form:

<div class="equation" id="eq-9"><img src="figures/eq-9.webp" width="467" height="36" alt="rj+1 = eλj+1t Z e−λj+1tΣkpk(t)eaktdt = eλj+1t Z Σkpk(t)e(ak−λj+1)tdt. (7)" loading="lazy" decoding="async"></div>

Integration of the sum is equal to the sum of the integrations, so we can write:

<div class="equation" id="eq-10"><img src="figures/eq-10.webp" width="377" height="37" alt="rj+1 = eλj+1tΣk Z pk(t)e(ak−λj+1)tdt. (8)" loading="lazy" decoding="async"></div>

Therefore, it is enough to show that R *p*<sub>k</sub>(*t*)*e*<sub>(ak−λj+1)t</sub>*dt* satisfies the condition, because a sum of sums of elements that satisfy the condition also satisfies the condition. Now, *p*<sub>k</sub>(*t*) is a polynomial, and therefore it is possible to obtain:

<div class="equation" id="eq-11"><img src="figures/eq-11.webp" width="667" height="37" alt="rj+1 = Z (c0 + c1t + · · · + cltl)e(ak−λj+1)tdt = Z c0e(ak−λj+1)t + Z c1te(ak−λj+1)t + · · · + Z cltle(ak−λj+1)tdt. (9)" loading="lazy" decoding="async"></div>

As a result, if one shows that R *c*<sub>l</sub>*t*<sub>l</sub>*e*<sub>(ak−λj+1)t</sub>*dt* satisfies the condition, the whole term satisfies the condition. Now,

<div class="equation" id="eq-12"><img src="figures/eq-12.webp" width="427" height="43" alt="Z cltle(ak−λj+1)tdt = Z ∞ (λj+1−ak)t cl (λj+1 −ak)l xle−xdx. (10)" loading="lazy" decoding="async"></div>

As this integral is the incomplete gamma function, it is possible to approximate it as follows:

<div class="equation" id="eq-13"><img src="figures/eq-13.webp" width="452" height="43" alt="−1 (λj+1 −ak) l+1cle(ak−λj+1)tΣl m=0 l! (l −m)!((λj+1 −ak)t)l−m. (11)" loading="lazy" decoding="async"></div>

Equation (11) is an exponent of a constant and a sum of polynomials and therefore satisfies the condition. Therefore, the first term in Equation (6) satisfies the condition. Therefore, *r*<sub>j</sub> for *j ∈* [1, *n −*1] satisfies the condition.

Since the Putzer algorithm [26] solves Equation (1), it is enough to show that it is possible to obtain *r*<sub>j</sub> using line 9 because the L-EXPM algorithm is an approximation of the Putzer algorithm and therefore solves Equation (1).

Now, for *j* = 1, *r*<sub>1</sub>(*t*) = *e*<sup>λ1t</sup> *−*1. According to Lemma 1, *r*<sub>2</sub> takes the form:

<div class="equation" id="eq-14"><img src="figures/eq-14.webp" width="662" height="73" alt="r2(t) = eλ2t R e−λ2t(eλ1t −1)dt −eλ2t R eλ1t −1dt|t=0 = e(λ2+λ1)t( 1 λ1−λ2 + 1 λ2 + α2) −eλ2t( 1 λ1 −t + α1), (12) where {αi}2 i=1 are constants. It is known that r2(0) = 1, so by setting t = 0 in Equation (12), one obtains:" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-15"><img src="figures/eq-15.webp" width="439" height="36" alt="r2(t) = ( λ1 λ2(λ1−λ2))e(λ2+λ1)t −( 1 λ1 −t)eλ2t + λ2 1−λ1λ2−λ2 λ1(λ1−λ2) . (13)" loading="lazy" decoding="async"></div>

This process repeats itself for any *r*<sub>j</sub>, *j ∈* [3, *n −*1].

## 3. Numerical Algorithm Evaluation

In comparison with other algorithms, L-EXPM’s storage requirements and complexity are asymptotically equal to the ones of the algorithms with the lowest storage requirements and complexity [8]. To evaluate the performance of L-EXPM compared to the state-of-the-art ME algorithms, a general case matrix may be required. Nevertheless, since ME algorithms provide large errors if the given matrix has a specific property, several families of stiff and non-stiff matrices should be used to obtain a general case analysis of the algorithm’s performance.

### 3.1. Artificial Stiff Matrices Analysis

We evaluate the performance of L-EXPM with respect to four state-of-the-art ME algorithms: Taylor, Pade, Newton, and Lagrange. For each algorithm, the parameters and tolerances are obtained using the grid search method [30]. Namely, for the Taylor algorithm, the number of terms is determined. In a similar manner, for the Pade algorithm, the fixed degrees combined with scaling and squaring [31,32] and the tolerance parameter are determined using the grid search method. The evaluation of the algorithms is performed using their MATLAB implementations (version 2020b). Since all five algorithms handle random, non-stiff matrices, we compared these algorithms on seven types of stiff matrices:

- 1. Matrices for which the difference between the eigenvalues of the matrix is small but not negligible: we randomly pick a value (*a >* 0) and an amplitude (*ϵ <<* 1) and generate matrices with eigenvalues that are in the range (*a ± ϵ*).
- 2. Matrices for which the eigenvalues are approaching 0: we generate matrices with eigenvalues that satisfy the following formula: 1 *≤ i ≤ n*, *λ*<sub>i</sub> = <sup>1</sup> <sub>(i+2)</sub>2 .
- 3. Matrices with large diameters: we generate matrices with eigenvalues that satisfy the formula
- 0 *≤ i ≤ n*, *λ*<sub>i</sub> = *a −* <sup>(a−b)i</sup> *n*
- , where *a* and *b* are picked randomly such that *b >> a*.
- 4. Matrices that have a large condition number: we generate matrices with eigenvalues that satisfy the formula 1 *≤ i ≤ n*, *λ*<sub>i</sub> *∈* [*a*, *b*], such that <sup>|b|</sup> <sub>|a|</sub> *>>* 1.
- 5. Matrices that have eigenvalues with significant algebraic multiplicity: we generate matrices with eigenvalues with an algebraic multiplicity of at least two.
- 6. Matrices with a single eigenvalue: we generate matrices with a single eigenvalue picked at random.
- 7. Matrices with complex eigenvalues with a large imaginary part: we generate matrices with eigenvalues that satisfy the formula 0 *≤ j ≤ n*, *λ*<sub>i</sub> = *a* + 10*i · a*, where *a ∈* [*−*100, 100] is a random number.

The matrices are generated as follows. First, a Jordan matrix (*J*) with the required eigenvalues is randomly generated. Then, a random matrix *P* with the same size of *J* is generated such that the condition number of *P* is less than two, and its determinant 0.5 *≤ det*(*P*) *≤* 1.5. The random matrix used in the analysis is obtained by computing *M* = *P*<sup>−1</sup>*JP*. For each type of matrix, we examine the performance of each algorithm on matrices with sizes 3 *×* 3, 10 *×* 10, 100 *×* 100, and 1000 *×* 1000 to determine the growth of the error as a function of the matrix’s size. Each value is obtained as the average of *n* = 100 repetitions, and the values of the matrices are generated using a normal distribution with mean *µ* = 0 and standard deviation *σ* = 300.

The numerical relative error is calculated using the *L*<sub>2</sub> distance between the analytically obtained (ground truth) ME matrix and the numerically obtained one: *Error* = *||A*(*M*) *− e*<sup>M</sup> <sub>gt</sub> *||*<sub>L2</sub>, where *A* is a numerical ME algorithm. The ground truth ME is obtained analytically by calculating the ME of the *J* matrix to obtain *e*<sup>M</sup> <sub>gt</sub> = *P*<sup>−1</sup>*e*<sup>J</sup>*P*. While (*e*<sup>M</sup> <sub>gt</sub> is a closed form, it is not guaranteed to be exact since the matrix (*e*<sup>M</sup> <sub>gt</sub> is a product of performing finite arithmetic. However, matrix (*e*<sup>M</sup> <sub>gt</sub> is computed as an ME of a diagonal matrix, which is formed by computing exactly the exponential of a floating point number and is assumed to be an accurate computation (up to *ϵ*-machine), and the multiplication with a random matrix with a small condition number (smaller than 2) is numerically stable [33]. Therefore, while the matrix (*e*<sup>M</sup> <sub>gt</sub> is not guaranteed to be exact, it is close enough to the ground truth for any applied purpose. The results of this analysis are shown in Table 1.

<figure class="table-figure" id="table-1">
<figcaption><strong>Table 1.</strong> Numerical relative error from four numerical ME algorithms and the L-EXPM ME algorithm of seven stiff cases of matrices for matrix sizes 3 <em>×</em> 3, 10 <em>×</em> 10, 100 <em>×</em> 100, and 1000 <em>×</em> 1000. The results are the average of <em>n</em> = 100 random matrices in each case. Err indicates an error in the computation due to stack overflow.</figcaption>
<div class="table-scroll"><table><tr><th>Matrix Size</th><th>Algorithm</th><th>Type 1</th><th>Type 2</th><th>Type 3</th><th>Type 4</th><th>Type 5</th><th>Type 6</th><th>Type 7</th></tr><tr><td>3 × 3</td><td>Naive</td><td>2 × 10−3</td><td>3 × 10−3</td><td>6 × 10−2</td><td>8 × 10−1</td><td>3 × 10−3</td><td>8 × 10−4</td><td>1 × 10−3</td></tr><tr><td>3 × 3</td><td>Pade</td><td>5 × 10−5</td><td>6 × 10−5</td><td>6 × 10−4</td><td>9 × 10−3</td><td>2 × 10−5</td><td>7 × 10−5</td><td>1 × 10−4</td></tr><tr><td>3 × 3</td><td>Newton</td><td>8 × 10−3</td><td>5 × 10−2</td><td>3 × 10−2</td><td>9 × 10−2</td><td>5 × 10−5</td><td>9 × 10−7</td><td>7 × 10−6</td></tr><tr><td>3 × 3</td><td>Lagrange</td><td>3 × 10−2</td><td>1 × 10−2</td><td>4 × 10−2</td><td>8 × 10−2</td><td>1 × 10−6</td><td>1 × 10−6</td><td>8 × 10−7</td></tr><tr><td>3 × 3</td><td>L-EXPM</td><td>1 × 10−4</td><td>8 × 10−6</td><td>8 × 10−4</td><td>8 × 10−3</td><td>9 × 10−7</td><td>1 × 10−6</td><td>3 × 10−7</td></tr><tr><td>10 × 10</td><td>Naive</td><td>4 × 10−1</td><td>3 × 10−1</td><td>1 × 100</td><td>8 × 100</td><td>4 × 10−1</td><td>8 × 10−1</td><td>1 × 100</td></tr><tr><td>10 × 10</td><td>Pade</td><td>1 × 10−4</td><td>5 × 10−5</td><td>2 × 10−3</td><td>2 × 10−1</td><td>8 × 10−2</td><td>8 × 10−2</td><td>1 × 10−2</td></tr><tr><td>10 × 10</td><td>Newton</td><td>2 × 10−2</td><td>5 × 10−1</td><td>8 × 10−1</td><td>3 × 100</td><td>5 × 101</td><td>1 × 10−3</td><td>3 × 10−3</td></tr><tr><td>10 × 10</td><td>Lagrange</td><td>2 × 10−2</td><td>3 × 10−1</td><td>1 × 100</td><td>4 × 100</td><td>7 × 101</td><td>5 × 10−3</td><td>2 × 10−3</td></tr><tr><td>10 × 10</td><td>L-EXPM</td><td>4 × 10−4</td><td>1 × 10−6</td><td>2 × 10−3</td><td>8 × 10−2</td><td>6 × 10−2</td><td>7 × 10−2</td><td>5 × 10−3</td></tr><tr><td>100 × 100</td><td>Naive</td><td>2 × 100</td><td>8 × 10−1</td><td>4 × 101</td><td>6 × 102</td><td>3 × 101</td><td>2 × 101</td><td>8 × 101</td></tr><tr><td>100 × 100</td><td>Pade</td><td>7 × 10−2</td><td>5 × 10−4</td><td>9 × 10−1</td><td>3 × 100</td><td>2 × 100</td><td>1 × 101</td><td>5 × 101</td></tr><tr><td>100 × 100</td><td>Newton</td><td>4 × 100</td><td>1 × 103</td><td>5 × 101</td><td>5 × 101</td><td>3 × 102</td><td>2 × 100</td><td>7 × 100</td></tr><tr><td>100 × 100</td><td>Lagrange</td><td>3 × 100</td><td>1 × 103</td><td>7 × 101</td><td>1 × 102</td><td>8 × 102</td><td>2 × 100</td><td>8 × 100</td></tr><tr><td>100 × 100</td><td>L-EXPM</td><td>3 × 10−2</td><td>3 × 10−4</td><td>1 × 100</td><td>5 × 100</td><td>8 × 100</td><td>4 × 100</td><td>1 × 101</td></tr><tr><td>1000 × 1000</td><td>Naive</td><td>2 × 105</td><td>7 × 106</td><td>Err</td><td>Err</td><td>Err</td><td>7 × 106</td><td>Err</td></tr><tr><td>1000 × 1000</td><td>Pade</td><td>8 × 102</td><td>2 × 103</td><td>Err</td><td>Err</td><td>3 × 103</td><td>6 × 102</td><td>1 × 104</td></tr><tr><td>1000 × 1000</td><td>Newton</td><td>3 × 104</td><td>Err</td><td>Err</td><td>Err</td><td>Err</td><td>1 × 103</td><td>3 × 104</td></tr><tr><td>1000 × 1000</td><td>Lagrange</td><td>2 × 104</td><td>Err</td><td>Err</td><td>Err</td><td>Err</td><td>3 × 103</td><td>6 × 104</td></tr><tr><td>1000 × 1000</td><td>L-EXPM</td><td>4 × 101</td><td>4 × 105</td><td>Err</td><td>Err</td><td>5 × 103</td><td>7 × 101</td><td>2 × 104</td></tr></table></div>

</figure>

Based on the results shown in Table 1, we compare the average relative error across the seven types of matrices of each algorithm divided by the matrix sizes, as shown in Figure 2, where each point is the mean value of each row in Table 1. The *x*-axis is the matrix’s size (i.e., dimension), and the y-axis is the numerical error as computed by the *L*<sub>2</sub> norm metric between the analytically and numerically obtained matrices. Unsurprisingly, all five algorithms present monotonically increasing numerical error with respect to the input’s matrix size.

<figure id="fig-2">
<img src="figures/fig-2.webp" width="572" height="356" alt="Average relative numerical error of the five ME algorithms across the five types of matrices divided by matrix size" loading="lazy" decoding="async">
<figcaption><strong>Figure 2.</strong> Average relative numerical error of the five ME algorithms across the five types of matrices divided by matrix size. * The values for the (1000 <em>×</em> 1000) case are the average of the matrices from types 1 and 6 (see Table 1) rather than all seven types.</figcaption>
</figure>

### 3.2. Control System’s Observability Use Case

One usage of MEs is linear control systems, wherein one records the output of a control system over time and wishes to obtain the input of the control system, which is known as the *observability* problem [34]. Formally, one observes the output from the system:

<div class="equation" id="eq-16"><img src="figures/eq-16.webp" width="327" height="41" alt="dx dt = Ax, y = Cx, (14)" loading="lazy" decoding="async"></div>

where *A*, *C ∈* R<sup>n×n</sup> over a finite period of time [*t*<sub>0</sub>, *T*], and we aim to compute *x*(*t*<sub>0</sub>). Analytically, this problem is solved by [35] and requires computing the ME of *A* and *C* (see [34] for more details). Based on the glucagon–glucose dynamics linear control system for the regulation of artificial pancreas solution in type 1 diabetes [36], we simulated *A* and *C* matrices of sizes 3 *×* 3, 11 *×* 11, 100 *×* 100, and 1000 *×* 1000 that follow the same distribution. In particular, we introduce Gaussian noise with a mean of 0.01 and standard deviation of 0.001 for all non-zero values in the matrix to simulate measurement error. This way, one obtains realistic samples of matrices that one can find in clinical settings. We used a dedicated server with an Ubuntu 18.04.5 operating system. The server had an Intel Core i7-9700K CPU and 64 GB RAM . All experiments were conducted in a linear fashion, and no other programs were executed on the device except for the operating system. This was to ensure the computation time was measured accurately. Each matrix’s size was computed with 100 different samples obtained by using the different seeds for the pseudo-random process. The results are shown as mean *±* standard deviation in Table 2.

Taken jointly, the resultsshow that L-EXPM has similar or slightly better numerical stability compared to current state-of-the-art ME algorithms for stiff matrices. For the more general case, L-EXPMs show statistically significant (*p <* 0.05 with paired two-tailed *t*-test) better error compared to the Pade algorithm. This outcome comes with a cost of one or two orders of magnitude more computational time.

<figure class="table-figure" id="table-2">
<figcaption><strong>Table 2.</strong> Comparison between the Pade approximation algorithm’s and the proposed L-EXPM algorithm’s errors and computation times (seconds) for the observability task.</figcaption>
<div class="table-scroll"><table><tr><td>Algorithm</td><td>Metric</td><td>3 × 3</td><td>10 × 10</td><td>100 × 100</td><td>1000 × 1000</td></tr><tr><td></td><td>Error</td><td>5.2 × 10−3 ± 2.8 × 10−4</td><td>9.8 × 10−3 ± 1.0 × 10−3</td><td>6.5 × 10−1 ± 8.3 × 10−2</td><td>8.3 × 100 ± 5.1 × 10−1</td></tr><tr><td>Pade</td><td>Time</td><td>3.1 × 10−3 ± 0.2 × 10−3</td><td>7.0 × 10−1 ± 0.4 × 10−1</td><td>5.8 × 101 ± 5.9 × 100</td><td>3.2 × 104 ± 0.7 × 104</td></tr><tr><td></td><td>Error</td><td>4.3 × 10−3 ± 7.5 × 10−5</td><td>6.9 × 10−3 ± 7.7 × 10−4</td><td>2.1 × 10−2 ± 4.1 × 10−3</td><td>7.6 × 10−1 ± 1.3 × 10−1</td></tr><tr><td>L-EXPM</td><td>Time</td><td>5.2 × 10−1 ± 0.9 × 10−1</td><td>1.4 × 101 ± 0.2 × 101</td><td>2.2 × 102 ± 0.3 × 102</td><td>8.5 × 105 ± 1.1 × 105</td></tr></table></div>

</figure>

## 4. Matrix Exponential Decision Tree

As shown in Table 1, there is no one ME algorithm that “rules them all” and outperforms all other ME algorithms for all cases in terms of numerical error. On top of that, we have neglected the computation time and resources needed to perform these algorithms on different matrices. Therefore, we can take advantage of the decision tree (DT) model. DTs are one of the most popular and efficient techniques in data mining and have been widely used thanks to their relatively easy interpretation and efficient computation time [37,38]. A DT is a mathematical tree graph wherein the root node has all the data, non-leaf nodes operate as decision nodes, and the leaf nodes store the model’s output for a given input that reaches them.

Two types of DTs are important for computational systems: For one, the numerical error is critical to the result such that the resources and computing time are less significant. The second case is where the numerical error is less significant, while the time and resources required to obtain the results need to be minimized.

To find these DTs, we first generate a data set (M) with 1000 matrices with sizes ranging between 3 and 100 generated for each of the first seven groups and an additional 7000 matrices from the eighth group generated to balance between stiff and non-stiff matrices (14,000 matrices in total). Afterward, the data set is divided into a *training* cohort and a *testing* cohort such that 80% of each sub-group of the data set is allocated to the training cohort, and the remaining 20% is allocated to the testing cohort. This process is repeated five times to obtain a five-fold split [39].

We aim to find a DT that is both computationally optimized and with minimal error and, as such, offers an optimal decision algorithm for the ME algorithm for any case while simultaneously taking into consideration computation time and numerical error. Therefore, we first define the available leaves and decision nodes for the DT. Each leaf node is a numerical ME algorithm with its own complexity, and each decision node is a discrete classification function that receives a matrix *M* and returns a value *v ∈* N. The components used to construct the DT are shown in Table 3.

We define a penalty function as the sum of the worst-case complexity of all the computational components (vertices, marked by *v ∈ V*) computed during the DT. In addition, to avoid over-fitting the optimization on a too-small DT that does not use anything and uses the algorithm with the least worst-case complexity, a decrease by one order of magnitude (factor of 10) in the relative error is equal to dividing by a linear factor from the worst overall complexity. Formally, one can write the optimization problem as follows:

<div class="equation" id="eq-17"><img src="figures/eq-17.webp" width="343" height="44" alt="min DT ΣM∈M Σv∈VC[v] log10E , (15)" loading="lazy" decoding="async"></div>

where M is the training set of matrices. We search for a directed acyclic graph (DAG) (*G* = (*V*, *E*)) for which for any pair of nodes *i/* = *j ∈* N : *v*<sub>i</sub>, *v*<sub>j</sub> *∈ V* for which there is a path from *v*<sub>i</sub> to *v*<sub>j</sub> satisfying that the asymptotic complexity of *v*<sub>i</sub> is smaller or equal to *v*<sub>j</sub>.

In addition, for the minimal error constraint, we compute the outcome for each one of the decision components shown in Table 3. We then compute the numerical relative error of each of the leaf components shown in Table 3 and store the index of the algorithm.

<figure class="table-figure" id="table-3">
<figcaption><strong>Table 3.</strong> The components that are available for the complexity-optimized DT.</figcaption>
<div class="table-scroll"><table><tr><th>Index</th><th>Component</th><th>Description</th><th>Worst Case<br/>Complexity<br/>(C)</th><th>Average Rela-<br/>tive Numeri-<br/>cal Error (E)</th><th>Is<br/>Leaf<br/>Node</th></tr><tr><td>1</td><td>Check form</td><td>The matrix is diagonal, trigonal, Jordan,<br/>or full</td><td>O(n2)</td><td>0</td><td>No</td></tr><tr><td>2</td><td>Is symmetric</td><td>The matrix is symmetric or not</td><td>O(n2)</td><td>0</td><td>No</td></tr><tr><td>3</td><td>Large diameter</td><td>The diameter of the matrix is larger than<br/>some threshold or not</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>4</td><td>Large algebraic multiplicity</td><td>There are eigenvalues with algebraic<br/>multiplicity that are larger than some<br/>threshold or not</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>5</td><td>Large condition number</td><td>The condition number of the matrix is<br/>larger than some threshold x or not</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>6</td><td>Single eigenvalue</td><td>Does the matrix have a single eigen-<br/>value</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>7</td><td>Complex eigenvalues</td><td>Eigenvalues are complex with a big<br/>imaginary part</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>8</td><td>Close eigenvalues</td><td>Eigenvalues λi, λj such that |λi −λj| &lt;<br/>const ∧λi̸ = λj</td><td>O(n3)</td><td>0</td><td>No</td></tr><tr><td>9</td><td>Diagonal</td><td>Diagonal matrix exponential</td><td>O(n)</td><td>0.13</td><td>Yes</td></tr><tr><td>10</td><td>Jordan</td><td>Jordan matrix exponential</td><td>O(n4)</td><td>21.21</td><td>Yes</td></tr><tr><td>11</td><td>Eigenvector algorithms</td><td>TRED2 [40] and TQL2 [8]</td><td>O(n4)</td><td>18.89</td><td>Yes</td></tr><tr><td>12</td><td>Ill condition algorithms</td><td>IMPSUB [8]</td><td>O(n4)</td><td>47.05</td><td>Yes</td></tr><tr><td>13</td><td>L-EXPM</td><td>The proposed L-EXPM algorithm</td><td>O(n4)</td><td>8.45</td><td>Yes</td></tr><tr><td>14</td><td>Eigenvalue-based approximation</td><td>Lagrange algorithm [8]</td><td>O(n5)</td><td>54.98</td><td>Yes</td></tr><tr><td>15</td><td>Different eigenvalue approximation</td><td>Newton algorithm [8]</td><td>O(n5)</td><td>52.73</td><td>Yes</td></tr><tr><td>16</td><td>Power series approximation</td><td>Pade approximation algorithm [8]</td><td>O(n4)</td><td>11.09</td><td>Yes</td></tr><tr><td>17</td><td>Naive</td><td>Naive algorithm</td><td>O(n4)</td><td>78.20</td><td>Yes</td></tr></table></div>

</figure>

Based on both the complexity and numerical error data sets, a genetic programming approach has been used to obtain the DT model [41,42]. First, an initial population of DT models is generated as follows: based on the generated numerical related data set, a DT model is trained using the *CART* algorithm and the *gini* dividing metric [43]. In addition, the grid search method [30] is used on the DT’s depth (ranging between two and seven levels) to obtain the best depth of the tree. Finally, the Boolean satisfiability-based post-pruning (SAT-PP) algorithm is used to obtain the smallest DT with the same level of accuracy [44]. The population of the DT model differs in two parameters: first, the maximum number of leaves, if the leaf node can be used twice or not, and the minimum samples for dividing a node [30].

Afterward, in each algorithmic step, each DT model is scored based on Equation (15) (without the optimization term)—performed as the *fitness* metric. The scores of all models are normalized such that the sum of the values equals 1. The top *p* percent (*p* is empirically picked to be 50%) of the population is kept for the next generation. The population is repopulated based on stochastic *mutations* of the remaining models. The mutation function operates as follows: First, two DT models are picked at random with a distribution corresponding to the fitness score of the models. Both DTs are scanned from the root node using the BFS algorithm [45] such that each node that they have is similarly allocated to the new DT model, and nodes that are different are taken from the first model 33% of the time and from the second model 33% of the time, and the remaining 34% are pruned.

The obtained DT model is shown in Figure 3, wherein each rectangle node is a decision node and each circle node is a leaf node, which is identified by its component name as defined in Table 3.

<figure id="fig-3">
<img src="figures/fig-3.webp" width="630" height="301" alt="Numerical-accuracy- and computation-complexity-optimized DT for numerical MEs" loading="lazy" decoding="async">
<figcaption><strong>Figure 3.</strong> Numerical-accuracy- and computation-complexity-optimized DT for numerical MEs.</figcaption>
</figure>

## 5. Conclusions

This study introduces a novel algorithm for numerically calculating matrix exponentials (MEs) that achieves high accuracy on stiff matrices while maintaining computational and memory efficiency comparable to existing ME algorithms. By combining eigenvalue-based and series-based approaches, the proposed L-EXPM algorithm demonstrates improved robustness against stiff matrices compared to individual methods. Although L-EXPM generally outperforms the Pade approximation algorithm, especially for large matrices, the latter remains preferable for time-sensitive applications due to its shorter computation time. In practical applications, like observability in control systems, L-EXPM shows superior accuracy but with longer computation times than Pade. To address varying matrix characteristics, a decision tree (DT) model integrating Boolean functions and ME algorithms is proposed, and it is optimized using machine learning and genetic programming techniques.

This study is not without limitations. First, an analytical boundary for the error, rather than the numerical one shown in this study, can be theoretically useful. Second, exploring the influence of different eigenvalue computation methods can further improve the numerical performance of L-EXPM. Finally, future research should focus on testing this DT model in diverse engineering contexts, particularly in control systems, to assess its performance across real-world scenarios.

**Author Contributions:** T.L.: conceptualization, data curation, methodology, formal analysis, investigation, supervision, software, visualization, project administration, and writing—original draft. S.B.-M.: validation and writing—review and editing. All authors have read and agreed to the published version of the manuscript.

**Funding:** This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

**Data Availability Statement:** All the data that were used were computed.

**Conflicts of Interest:** The authors have no conflicts of interest to declare that are relevant to the content of this article.

## References

1. Dunn, S.M.; Constantinides, A.; Moghe, P.V. Chapter 7—Dynamic Systems: Ordinary Differential Equations. In Numerical Methods in Biomedical Engineering; Academic Press: Cambridge, MA, USA, 2006; pp. 209–287.
2. Van Loan, C. Computing integrals involving the matrix exponential. IEEE Trans. Autom. Control 1978, 23, 395–404. [doi:10.1109/TAC.1978.1101743](https://doi.org/10.1109/TAC.1978.1101743)
3. Al-Mohy, A.H.; Higham, N.J. Computing the Action of the Matrix Exponential, with an Application to Exponential Integrators. SIAM J. Sci. Comput. 2011, 33, 488–511. [doi:10.1137/100788860](https://doi.org/10.1137/100788860)
4. Aboanber, A.E.; Nahla, A.A.; El-Mhlawy, A.M.; Maher, O. An efficient exponential representation for solving the two-energy group point telegraph kinetics model. Ann. Nucl. Energy 2022, 166, 108698. [doi:10.1016/j.anucene.2021.108698](https://doi.org/10.1016/j.anucene.2021.108698)
5. Damgaard, P.; Hansen, E.; Plante, L.; Vanhove, P. Classical observables from the exponential representation of the gravitational S-matrix. J. High Energy Phys. 2023, 2023, 183. [doi:10.1007/JHEP09(2023)183](https://doi.org/10.1007/JHEP09%282023%29183)
6. Datta, B.N. Chapter 5—Linear State-Space Models and Solutions of the State Equations. In Numerical Methods for Linear Control Systems: Design and Analysis; Academic Press: Cambridge, MA, USA, 2004; pp. 107–157.
7. Fadali, M.S.; Visioli, A. State–space representation. In Digital Control Engineering: Analysis and Design; Academic Press: Cambridge, MA, USA, 2020; pp. 253–318.
8. Moler, C.; Van Loan, C. Nineteen dubious ways to compute the exponential of a matrix, twenty-five years later. SIAM Rev. 2003, 45, 3–49. [doi:10.1137/S00361445024180](https://doi.org/10.1137/S00361445024180)
9. Ward, R.C. Numerical Computation of the Matrix Exponential with Accuracy Estimate. SIAM J. Numer. Anal. 1977, 14, 600–610. [doi:10.1137/0714039](https://doi.org/10.1137/0714039)
10. Zhou, C.; Wang, Z.; Chen, Y.; Xu, J.; Li, R. Benchmark Buckling Solutions of Truncated Conical Shells by Multiplicative Perturbation With Precise Matrix Exponential Computation. J. Appl. Mech. 2022, 89, 081004. [doi:10.1115/1.4054714](https://doi.org/10.1115/1.4054714)
11. Wan, M.; Zhang, Y.; Yang, G.; Guo, H. Two-Dimensional Exponential Sparse Discriminant Local Preserving Projections. Mathematics 2023, 11, 1722. [doi:10.3390/math11071722](https://doi.org/10.3390/math11071722)
12. Najfeld, I.; Havel, T. Derivatives of the Matrix Exponential and Their Computation. Adv. Appl. Math. 1995, 16, 321–375. [doi:10.1006/aama.1995.1017](https://doi.org/10.1006/aama.1995.1017)
13. Genocchi, A.; Peano, G. Calcolo Differenziale e Principii di Calcolo Integrale; Fratelli Bocca: Rome, Italy, 1884; Volume 67, pp. XVII–XIX. (In Italian)
14. Biswas, B.N.; Chatterjee, S.; Mukherjee, S.P.; Pal, S. A Discussion on Euler Method: A Review. Electron. J. Math. Anal. Appl. 2013, 1, 294–317.
15. Hochbruck, M.; Ostermann, A. Exponential Integrators; Cambridge University Press: Cambridge, UK, 2010; pp. 209–286.
16. Butcher, J. A history of Runge-Kutta methods. Appl. Numer. Math. 1996, 20, 247–260. [doi:10.1016/0168-9274(95)00108-5](https://doi.org/10.1016/0168-9274%2895%2900108-5)
17. Wang, H. The Krylov Subspace Methods for the Computation of Matrix Exponentials. Ph.D. Thesis, University of Kentucky, Lexington, KY, USA, 2015.
18. Dinh, K.N.; Sidje, R.B. Analysis of inexact Krylov subspace methods for approximating the matrix exponential. Math. Comput. Simulati. 2017, 1038, 1–13. [doi:10.1016/j.matcom.2017.01.002](https://doi.org/10.1016/j.matcom.2017.01.002)
19. Druskin, V.; Greenbaum, A.; Knizhnerman, L. Using nonorthogonal Lanczos vectors in the computation of matrix functions. SIAM J. Sci. Comput. 1998, 19, 38–54. [doi:10.1137/S1064827596303661](https://doi.org/10.1137/S1064827596303661)
20. Druskin, V.L.; Knizhnerman, L.A. Krylov subspace approximations of eigenpairs and matrix functions in exact and computer arithemetic. Numer. Linear Algebra Appl. 1995, 2, 205–217. [doi:10.1002/nla.1680020303](https://doi.org/10.1002/nla.1680020303)
21. Ye, Q. Error bounds for the Lanczos methods for approximating matrix exponentials. SIAM J. Numer. Anal. 2013, 51, 66–87. [doi:10.1137/11085935X](https://doi.org/10.1137/11085935X)
22. Pulungan, R.; Hermanns, H. Transient Analysis of CTMCs: Uniformization or Matrix Exponential. Int. J. Comput. Sci. 2018, 45, 267–274.
23. Reibman, A. Trivedi, K. Numerical transient analysis of markov models. Comput. Oper. Res. 1988, 15, 19–36. [doi:10.1016/0305-0548(88)90026-3](https://doi.org/10.1016/0305-0548%2888%2990026-3)
24. Wu, W.; Li, P.; Fu, X.; Wang, Z.; Wu, J.; Wang, C. GPU-based power converter transient simulation with matrix exponential integration and memory management. Int. J. Electr. Power Energy Syst. 2020, 122, 106186. [doi:10.1016/j.ijepes.2020.106186](https://doi.org/10.1016/j.ijepes.2020.106186)
25. Dogan, O.; Yang, Y.; Taspınar, S. Information criteria for matrix exponential spatial specifications. Spat. Stat. 2023, 57, 100776. [doi:10.1016/j.spasta.2023.100776](https://doi.org/10.1016/j.spasta.2023.100776)
26. Wahln, E. Alternative Proof of Putzer’s Algorithm. 2013. Available online: http://www.ctr.maths.lu.se/media11/MATM14/2013vt2013/putzer.pdf (accessed on 17 February 2021). [link](http://www.ctr.maths.lu.se/media11/MATM14/2013vt2013/putzer.pdf)
27. Lanczos, C. An iteration method for the solution of the eigenvalue problem of linear differential and integral operators. J. Res. Natl. Bur. Stand. 1950, 45, 225–282. [doi:10.6028/jres.045.026](https://doi.org/10.6028/jres.045.026)
28. Ojalvo, I.U.; Newman, M. Vibration modes of large structures by an automatic matrix-reduction methods. AIAA J. 1970, 8, 1234–1239. [doi:10.2514/3.5878](https://doi.org/10.2514/3.5878)
29. Barnard, S.T.; Simon, H.D. Fast multilevel implementation of recursive spectral bisection for partitioning unstructured problems. Concurr. Comput. Pract. Exp. 1994, 6, 101–117. [doi:10.1002/cpe.4330060203](https://doi.org/10.1002/cpe.4330060203)
30. Liu, R.; Liu, E.; Yang, J.; Li, M.; Wang, F. Optimizing the Hyper-parameters for SVM by Combining Evolution Strategies with a Grid Search. In Intelligent Control and Automation; Springer: Berlin/Heidelberg, Germany, 2006; Volume 344.
31. Al-mohy, A.H.; Higham, N.J. A New Scaling and Squaring Algorithm for the Matrix Exponential. SIAM J. Matrix Anal. Appl. 2009, 31, 970–989. [doi:10.1137/09074721X](https://doi.org/10.1137/09074721X)
32. Higham, N.J. The Scaling and Squaring Method for the Matrix Exponential Revisited. SIAM J. Matrix Anal. Appl. 2005, 26, 1179–1193. [doi:10.1137/04061101X](https://doi.org/10.1137/04061101X)
33. Demmel, J.; Dumitriu, I.; Holtz, O.; Kleinberg, R. Fast matrix multiplication is stable. Numer. Math. 2007, 106, 199–224. [doi:10.1007/s00211-007-0061-6](https://doi.org/10.1007/s00211-007-0061-6)
34. Poulsen, N.K. The Matrix Exponential, Dynamic Systems and Control; DTU Compute: Kongens Lyngby, Denmark, 2004.
35. Kailath, T. Linear Systems; Prentice Hall: Upper Saddle River, NJ, USA, 1980.
36. Farman, M.; Saleem, M.U.; Tabassum, M.F.; Ahmad, A.; Ahmad, M.O. A linear control of composite model for glucose insulin glucagon pump. Ain Shams Eng. J. 2019, 10, 867–872. [doi:10.1016/j.asej.2019.04.001](https://doi.org/10.1016/j.asej.2019.04.001)
37. Swain, P.H.; Hauska, H. The decision tree classifier: Design and potential. IEEE Trans. Geosci. Electron. 1977, 15, 142–147. [doi:10.1109/TGE.1977.6498972](https://doi.org/10.1109/TGE.1977.6498972)
38. Stiglic, G.; Kocbek, S.; Pernek, I.; Kokol, P. Comprehensive Decision Tree Models in Bioinformatics. PLoS ONE 2012, 7, e33812. [doi:10.1371/journal.pone.0033812](https://doi.org/10.1371/journal.pone.0033812)
39. Kohavi, R. A Study of Cross Validation and Bootstrap for Accuracy Estimation and Model Select. In Proceedings of the International Joint Conference on Artificial Intelligence, Montreal, QC, Canada, 20–25 August 1995.
40. Lu, Y.Y. Exponentials of symmetric matrices through tridiagonal reductions. Linear Algerba Its Appl. 1998, 279, 317–324. [doi:10.1016/S0024-3795(98)00017-2](https://doi.org/10.1016/S0024-3795%2898%2900017-2)
41. Koza, J.R.; Poli, R. Genetic Programming. In Search Methodologies: Introductory Tutorials in Optimization and Decision Support Techniques; Springer: New York, NY, USA, 2005; pp. 127–164.
42. Alexi, A.; Lazebnik, T.; Shami, L. Microfounded Tax Revenue Forecast Model with Heterogeneous Population and Genetic Algorithm Approach. Comput. Econ. 2023.. [doi:10.1007/s10614-023-10379-2](https://doi.org/10.1007/s10614-023-10379-2)
43. Grabmeier, J.L.; Lambe, L.A. Decision trees for binary classification variables grow equally with the Gini impurity measure and Pearson’s chi-square test. Int. J. Bus. Intell. Data Min. 2007, 2, 213–226. [doi:10.1504/IJBIDM.2007.013938](https://doi.org/10.1504/IJBIDM.2007.013938)
44. Lazebnik, T.; Bahouth, Z.; Bunimovich-Mendrazitsky, S.; Halachmi, S. Predicting acute kidney injury following open partial nephrectomy treatment using SAT-pruned explainable machine learning model. BMC Med. Inform. Decis. Mak. 2022, 22, 133. [doi:10.1186/s12911-022-01877-8](https://doi.org/10.1186/s12911-022-01877-8)
45. Moore, E.F. The shortest path through a maze. In Proceedings of the International Symposium on the Theory of Switching; Harvard University Press: Cambridge, MA, USA, 1959; pp. 285–292.
