package hospital.management.system;


import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.ResultSet;

public class update_patient_details extends JFrame {


    update_patient_details(){
        JPanel panel=new JPanel();
        panel.setBounds(5,5,940,490);
        panel.setBackground(new Color(90,156,163));
        panel.setLayout(null);
        add(panel);

        try {
            java.net.URL imgURL = ClassLoader.getSystemResource("icon/updated.png");
            if (imgURL != null) {
                ImageIcon imageIcon = new ImageIcon(imgURL);
                Image image = imageIcon.getImage().getScaledInstance(250, 300, Image.SCALE_DEFAULT);
                ImageIcon imageIcon1 = new ImageIcon(image);
                JLabel label = new JLabel(imageIcon1);
                label.setBounds(500,60,250,300);
                panel.add(label);
            }
        } catch (Exception e) {
            System.out.println("Icon not found: icon/updated.png");
        }

        JLabel label1=new JLabel("Update Patient details");
        label1.setBounds(124,11,260,25);
        label1.setFont(new Font("Tahoma",Font.PLAIN,20));
        label1.setForeground(Color.white);
        panel.add(label1);

        JLabel label2=new JLabel("Name");
        label2.setBounds(25,88,46,14);
        label2.setFont(new Font("Tahoma",Font.BOLD,14));
        label2.setForeground(Color.white);
        panel.add(label2);

       Choice choice=new Choice();
       choice.setBounds(248,90,150,26);
       panel.add(choice);
        try {
            connection con = new connection();
            ResultSet resultset = con.statement.executeQuery("select * from patient_Info");

            while (resultset.next()) {
                choice.add(resultset.getString("Name"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        JLabel label3=new JLabel("Room Number");
        label3.setBounds(25,129,150,14);
        label3.setFont(new Font("Tahoma",Font.BOLD,14));
        label3.setForeground(Color.white);
        panel.add(label3);

        JTextField textFieldR=new JTextField();
        textFieldR.setBounds(248,129,140,21);
        panel.add(textFieldR);

        JLabel label4=new JLabel("In-Time");
        label4.setBounds(25,174,100,14);
        label4.setFont(new Font("Tahoma",Font.BOLD,14));
        label4.setForeground(Color.white);
        panel.add(label4);


        JTextField textFieldInTime=new JTextField();
        textFieldInTime.setBounds(248,174,140,21);
        panel.add(textFieldInTime);



        JLabel label5=new JLabel("Amount Paid (Rs)");
        label5.setBounds(25,216,150,14);
        label5.setFont(new Font("Tahoma",Font.BOLD,14));
        label5.setForeground(Color.white);
        panel.add(label5);


        JTextField textFieldAmount=new JTextField();
        textFieldAmount.setBounds(248,216,140,21);
        panel.add(textFieldAmount);

        JLabel label6=new JLabel("Pending Paid (Rs)");
        label6.setBounds(25,261,150,14);
        label6.setFont(new Font("Tahoma",Font.BOLD,14));
        label6.setForeground(Color.white);
        panel.add(label6);


        JTextField textFieldPending=new JTextField();
        textFieldPending.setBounds(248,261,140,21);
        panel.add(textFieldPending);

        JButton check=new JButton("Check");
        check.setBounds(281,378,89,25);
        check.setBackground(Color.black);
        check.setForeground(Color.WHITE);
        panel.add(check);
        check.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                String id = choice.getSelectedItem();
                String q ="select * from patient_Info where Name='"+id+"'";

                try {
                    connection con = new connection();
                    ResultSet resultSet = con.statement.executeQuery(q);

                    while (resultSet.next()) {
                        textFieldR.setText(resultSet.getString("Room Number"));
                        textFieldInTime.setText(resultSet.getString("In-Time"));
                        textFieldAmount.setText(resultSet.getString("Deposite"));


                    }

                    ResultSet resultSet1 = con.statement.executeQuery("select * from room where room_no='"+textFieldR.getText()+"'");
                    while (resultSet1.next()) {
                        String price = resultSet1.getString("Price");
                        int amountpaid = Integer.parseInt(price) - Integer.parseInt(textFieldAmount.getText());
                        textFieldAmount.setText(""+amountpaid);
                    }



                }catch(Exception E){
                    E.printStackTrace();

                }

            }


        });

        JButton update=new JButton("update");
        update .setBounds(56,378,89,25);
        update.setBackground(Color.black);
        update.setForeground(Color.WHITE);
        panel.add(update);
        update.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                try{
                    connection con = new connection();
                    String q = choice.getSelectedItem();
                    String room = textFieldR.getText();
                    String time = textFieldInTime.getText();
                    String amount = textFieldAmount.getText();
                    con.statement.executeUpdate("update patient_Info set Room_Number='"+room+"',Time='"+time+"',Deposite='"+amount+"' where Name='"+q+"'");
                    JOptionPane.showMessageDialog(null," Updated Successfully");
                    setVisible(false);
                }catch(Exception E){
                    E.printStackTrace();
                }

            }
        });

        JButton back=new JButton("BACK");
        back .setBounds(168,378,89,25);
        back.setBackground(Color.black);
        back.setForeground(Color.WHITE);
        panel.add(back);
        back.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                setVisible(false);
            }
        });




        setUndecorated(true);
        setSize(900,500);
        setLayout(null);
        setVisible(true);
        setLocation(400,250);


    }
    public static void main(String[] args) {
        new update_patient_details();

    }
}
