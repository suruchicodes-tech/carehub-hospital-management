package hospital.management.system;

import net.proteanit.sql.DbUtils;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.ResultSet;

public class Department extends JFrame {

    Department(){

        JPanel panel = new JPanel();
        panel.setBounds(5,5,690,490);
        panel.setBackground( new Color( 90, 156,163));
        panel.setLayout(null);
        add(panel);


        JTable table = new JTable();
        table.setBounds(0,40,700,350);
        table.setBackground( new Color( 90, 156,163));
        table.setFont(new Font("tahoma",Font.BOLD,14));
        panel. add(table);

        try{
            connection con = new connection();
            String q ="select * from department";
            ResultSet rs = con.statement.executeQuery(q);
            table.setModel(DbUtils.resultSetToTableModel(rs));



        } catch (Exception e){
            e.printStackTrace();
        }

        JLabel label1 = new JLabel("Department");
        label1.setBounds(145,11,105,20);
        label1.setFont(new Font("tahoma",Font.BOLD,14));
        panel.add(label1);

        JLabel label2= new JLabel("phone Number");
        label2.setBounds(431,11,150,20);
        label2.setFont(new Font("tahoma",Font.BOLD,14));
        panel.add(label2);


        JButton button1= new JButton("BACK");
        button1.setBounds(400,410,130,30);
        button1.setBackground(Color.BLACK);
        button1.setForeground(Color.WHITE);
        panel.add(button1);
        button1.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                setVisible(false);

            }
        });


        setUndecorated(true);










        setSize(700,500);
        setLayout(null);
        setLocation(350,250);
        setVisible(true);



    }
    public  static void main(String[] args) {
        new Department();

    }
}
