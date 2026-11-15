# WinFormsJS
WinForms JS

WinForms JS est une bibliothèque visant à faciliter la migration et le développement d’applications Web à partir de projets C# WinForms.

L’objectif est de permettre aux développeurs habitués à WinForms de créer plus facilement des applications Web basées sur ASP.NET, CSHTML, MVC/MVVC et JavaScript, en conservant autant que possible la même logique de programmation, la même organisation des composants et une approche similaire à celle de WinForms.

🎯 Objectif

Transformer progressivement une application C# WinForms en application Web sans devoir réapprendre complètement une nouvelle approche de développement.

WinForms JS propose notamment :

- Une logique de développement inspirée de Windows Forms.
- Des composants Web ayant un fonctionnement proche des composants WinForms.
- Une approche simplifiée de la gestion des contrôles, événements et propriétés.
- Une intégration avec ASP.NET / CSHTML.
- L'utilisation de JavaScript pour la partie cliente.
- Une architecture permettant de conserver une logique applicative proche de celle d'une application WinForms.

💡 Concept

L'idée principale est de rapprocher le modèle de développement Desktop WinForms du développement Web.

Par exemple, un développeur habitué à :
Button button1 = new Button();
button1.Text = "Valider";
button1.Click += Button1_Click;
private void Button1_Click(object sender,EventArgs e))
{
// your work
}
JavaScript:

var button1 = new Button();
button1.Text = "Valider";
AddEventHandler(this.button1,"Click",(sender,e) => Button1_Click(sender,e));

async Button1_Click(sender,e))
{
// your work
}
pourrait retrouver une approche similaire côté Web, tout en bénéficiant des technologies ASP.NET, HTML, CSS et JavaScript.

🚀 Pourquoi WinForms JS ?

Le développement Web nécessite généralement de maîtriser plusieurs technologies et concepts : HTML, CSS, JavaScript, DOM, événements, requêtes HTTP, MVC, etc.

WinForms JS cherche à réduire cette complexité pour les développeurs ayant une forte expérience en C# WinForms, en leur permettant de réutiliser une logique et des habitudes de développement qu'ils connaissent déjà.

«Write Web applications with a WinForms mindset.»

🔧 Technologies

- C#
- ASP.NET
- CSHTML / Razor
- MVC / MVVC
- JavaScript
- HTML / CSS

📌 Statut du projet En cours de developpement <img width="1123" height="637" alt="image" src="https://github.com/user-attachments/assets/2300201a-ec74-4af1-a8dc-3923c365ff16" />


Projet en développement.

L'objectif est d'enrichir progressivement la bibliothèque avec davantage de composants et de fonctionnalités afin de faciliter la migration des applications WinForms vers le Web.En
