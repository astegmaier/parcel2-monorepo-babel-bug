class MyClassWithProperties {
  message = "Hello from a class!";
  sayHello() {
    console.log(this.message ?? "backup message");
  }
  renderHello() {
    return <div>{this.message}</div>;
  }
}
const myInstance = new MyClassWithProperties();
myInstance.sayHello();
const myJsx = myInstance.renderHello();
